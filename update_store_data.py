#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""P-WORLDの「市区郡から探す」をたどって店舗マスターを生成するPC用ツール。Ver8.28

住所の解析は行いません。
1. 各都道府県トップの「市区郡から探す」から市区郡ページのURLを取得
2. 各市区郡ページの店舗一覧から店舗名(h2)だけを取得
3. 都道府県・市区郡・店舗名の3項目で store-data.json を生成

P-WORLDの市区郡ページは現在、例として
https://www.p-world.co.jp/tokushima/cities/36011/halls
のようなURLになっています。
"""
from __future__ import annotations
import json, re, html, time, sys
from pathlib import Path
from datetime import datetime, timezone, timedelta
from urllib.parse import urljoin, urlparse
from urllib.request import Request, urlopen
from html.parser import HTMLParser

BASE = 'https://www.p-world.co.jp'
UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0 Safari/537.36'
JST = timezone(timedelta(hours=9))
PREFS = ('北海道','青森県','岩手県','宮城県','秋田県','山形県','福島県','茨城県','栃木県','群馬県','埼玉県','千葉県','東京都','神奈川県','新潟県','富山県','石川県','福井県','山梨県','長野県','岐阜県','静岡県','愛知県','三重県','滋賀県','京都府','大阪府','兵庫県','奈良県','和歌山県','鳥取県','島根県','岡山県','広島県','山口県','徳島県','香川県','愛媛県','高知県','福岡県','佐賀県','長崎県','熊本県','大分県','宮崎県','鹿児島県','沖縄県')
# P-WORLDの都道府県ディレクトリ名
PREF_SLUGS = {
    '北海道':'hokkaido','青森県':'aomori','岩手県':'iwate','宮城県':'miyagi','秋田県':'akita','山形県':'yamagata','福島県':'fukushima',
    '茨城県':'ibaraki','栃木県':'tochigi','群馬県':'gunma','埼玉県':'saitama','千葉県':'chiba','東京都':'tokyo','神奈川県':'kanagawa',
    '新潟県':'niigata','富山県':'toyama','石川県':'ishikawa','福井県':'fukui','山梨県':'yamanashi','長野県':'nagano','岐阜県':'gifu',
    '静岡県':'shizuoka','愛知県':'aichi','三重県':'mie','滋賀県':'shiga','京都府':'kyoto','大阪府':'osaka','兵庫県':'hyogo',
    '奈良県':'nara','和歌山県':'wakayama','鳥取県':'tottori','島根県':'shimane','岡山県':'okayama','広島県':'hiroshima','山口県':'yamaguchi',
    '徳島県':'tokushima','香川県':'kagawa','愛媛県':'ehime','高知県':'kochi','福岡県':'fukuoka','佐賀県':'saga','長崎県':'nagasaki',
    '熊本県':'kumamoto','大分県':'oita','宮崎県':'miyazaki','鹿児島県':'kagoshima','沖縄県':'okinawa'
}


def norm(s: str) -> str:
    return re.sub(r'\s+', ' ', html.unescape(s).replace('\u3000', ' ')).strip()


def fetch(url: str, referer: str | None = None, attempts: int = 3) -> str:
    last = None
    for n in range(1, attempts + 1):
        try:
            req = Request(url, headers={
                'User-Agent': UA,
                'Accept-Language': 'ja-JP,ja;q=0.9',
                'Accept-Encoding': 'identity',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Referer': referer or BASE + '/',
                'Connection': 'close',
            })
            with urlopen(req, timeout=30) as r:
                raw = r.read()
                enc = r.headers.get_content_charset() or 'utf-8'
                text = raw.decode(enc, errors='replace')
                if '<html' not in text.lower() and '<!doctype' not in text.lower():
                    raise RuntimeError('HTMLではない応答でした')
                return text
        except Exception as e:
            last = e
            if n < attempts:
                time.sleep(n)
    raise last


class CityLinkParser(HTMLParser):
    """都道府県ページから /cities/<id>/halls のリンクだけを拾う。"""
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.in_a = False
        self.href = ''
        self.text = []
        self.items = []

    def handle_starttag(self, tag, attrs):
        if tag.lower() == 'a':
            d = dict(attrs)
            href = html.unescape(d.get('href', '') or '')
            if re.search(r'/cities/\d+/halls/?(?:\?.*)?$', href):
                self.in_a = True
                self.href = urljoin(BASE, href)
                self.text = []

    def handle_data(self, data):
        if self.in_a:
            self.text.append(data)

    def handle_endtag(self, tag):
        if tag.lower() == 'a' and self.in_a:
            name = norm(' '.join(self.text))
            if name:
                self.items.append((name, self.href))
            self.in_a = False
            self.href = ''
            self.text = []


class StoreH2Parser(HTMLParser):
    """市区郡ページから店舗名とP-WORLD掲載の貸出条件を取得する。

    料金表示は店舗ブロック内のテキストから、たとえば
    「1000円/46枚」「1000円/250玉」のような明示的な貸出条件だけを抽出する。
    交換率はP-WORLDの掲載情報だけでは一律に確定できないため取得しない。
    """
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.in_h2 = False
        self.in_block = False
        self.h2_text = []
        self.block_text = []
        self.h2_href = ''
        self.items = []

    def handle_starttag(self, tag, attrs):
        tag = tag.lower()
        if tag == 'h2':
            self._finish()
            self.in_block = True
            self.in_h2 = True
            self.h2_text = []
            self.block_text = []
            self.h2_href = ''
        elif self.in_block and self.in_h2 and tag == 'a':
            d = dict(attrs)
            href = html.unescape(d.get('href', '') or '')
            if href and not self.h2_href:
                self.h2_href = urljoin(BASE, href)

    def handle_data(self, data):
        if self.in_block:
            self.block_text.append(data)
        if self.in_h2:
            self.h2_text.append(data)

    def handle_endtag(self, tag):
        if tag.lower() == 'h2' and self.in_h2:
            self.in_h2 = False

    def _finish(self):
        if not self.in_block:
            return
        name = norm(' '.join(self.h2_text))
        if name:
            text = norm(' '.join(self.block_text))
            self.items.append({'name': name, 'url': self.h2_href, 'rates': parse_lending_rates(text)})
        self.in_block = False
        self.in_h2 = False
        self.h2_text = []
        self.block_text = []
        self.h2_href = ''

    def close(self):
        super().close()
        self._finish()


def parse_lending_rates(text: str):
    """P-WORLDの店舗ブロックから貸出条件を正規化して抽出する。

    表記揺れをできるだけ吸収する：
      1000円/46枚 / 1,000円／46枚 / 1000円46枚
      1000円=46枚 / 1000円：46枚 / 1000円→46枚
      1000円 46枚 / 1000円貸出46枚
    「交換」は対象にせず、P-WORLDに明示された貸出条件だけを扱う。
    """
    raw = html.unescape(str(text or ''))
    raw = raw.replace('\u3000', ' ').replace('\uff0f', '/').replace('\uff1d', '=')
    raw = raw.replace('，', ',').replace('：', ':').replace('→', '->').replace('⇒', '->')
    # 数字・単位の間に入る改行や過剰な空白を吸収。ただし数字同士は連結しない。
    raw = re.sub(r'[\t\r\n]+', ' ', raw)

    # 区切り文字は「/」「=」「:」「->」のほか、空白、括弧、貸出/貸し出し等を許容。
    # 例: 1000円/46枚, 1,000円／46枚, 1000円 46枚, 1000円貸出46枚
    sep = r'(?:\s+|[/=:\-]|->|\(|\)|\[|\]|で|につき|貸出(?:し)?|貸し出し)'
    sep_optional = r'(?:\s*[/=:\-]\s*|\s+|で|につき|貸出(?:し)?|貸し出し)?'
    patterns = [
        re.compile(r'(\d[\d,]*(?:\.\d+)?)\s*円\s*' + sep + r'\s*(\d[\d,]*(?:\.\d+)?)\s*(枚|玉)', re.IGNORECASE),
        re.compile(r'(\d[\d,]*(?:\.\d+)?)\s*円' + sep_optional + r'(\d[\d,]*(?:\.\d+)?)\s*(枚|玉)', re.IGNORECASE),
    ]

    out = []
    matches = []
    for pat in patterns:
        matches.extend(pat.finditer(raw))
    for m in sorted(matches, key=lambda x: x.start()):
        yen = float(m.group(1).replace(',', ''))
        units = float(m.group(2).replace(',', ''))
        unit = m.group(3)
        if yen <= 0 or units <= 0:
            continue
        genre = 'パチスロ' if unit == '枚' else 'パチンコ'
        out.append({
            'genre': genre,
            'rate': round(yen / units, 4),
            'loanUnits': units,
            'loanYen': yen
        })

    # 旧表記や同一条件の重複を除去
    seen = set(); uniq = []
    for x in out:
        k = (x['genre'], round(x['rate'], 4), x['loanUnits'], x['loanYen'])
        if k not in seen:
            seen.add(k); uniq.append(x)
    return uniq



def parse_store_detail_rates(text: str):
    """店舗詳細ページから遊技料金を取得する。

    店舗一覧ページで貸出条件を取得できなかった場合のフォールバック用。
    店舗詳細ページでは「遊技料金」「[1000円/49枚]」のような表示を
    店舗単位で取得できるため、一覧側で取りこぼした条件を補完する。
    """
    raw = html.unescape(str(text or ''))
    raw = raw.replace('\u3000', ' ').replace('\uff0f', '/').replace('\uff1d', '=')
    raw = raw.replace('，', ',').replace('：', ':').replace('→', '->').replace('⇒', '->')
    raw = re.sub(r'[\t\r\n]+', ' ', raw)

    # 「1000円/49枚」「500円/490玉」等を広く拾う。
    # 店舗詳細ページ全体には広告文などにも金額が出る可能性があるため、
    # まず「遊技料金」付近を優先して検索し、見つからなければ全体を検索する。
    price_pattern = re.compile(
        r'(\d[\d,]*(?:\.\d+)?)\s*円\s*'
        r'(?:\s*[/=:\-]\s*|\s+|で|につき|貸出(?:し)?|貸し出し)\s*'
        r'(\d[\d,]*(?:\.\d+)?)\s*(枚|玉)',
        re.IGNORECASE
    )

    targets = []
    for m in re.finditer(r'遊技料金', raw):
        targets.append(raw[m.start():m.start()+1200])
    if not targets:
        targets = [raw]

    out=[]
    for target in targets:
        for m in price_pattern.finditer(target):
            yen=float(m.group(1).replace(',',''))
            units=float(m.group(2).replace(',',''))
            unit=m.group(3)
            if yen <= 0 or units <= 0:
                continue
            genre='パチスロ' if unit == '枚' else 'パチンコ'
            out.append({
                'genre': genre,
                'rate': round(yen / units, 4),
                'loanUnits': units,
                'loanYen': yen
            })

    seen=set(); uniq=[]
    for x in out:
        k=(x['genre'], round(x['rate'],4), x['loanUnits'], x['loanYen'])
        if k not in seen:
            seen.add(k); uniq.append(x)
    return uniq


def merge_rates(primary, fallback):
    """一覧ページの条件を基本にしつつ、詳細ページの条件を不足分として補完する。"""
    out=[]
    seen=set()
    for x in list(primary or []) + list(fallback or []):
        k=(x.get('genre'), round(float(x.get('rate',0)),4), x.get('loanUnits'), x.get('loanYen'))
        if k not in seen:
            seen.add(k); out.append(x)
    return out

def parse_city_links(text: str):
    p = CityLinkParser()
    p.feed(text)
    p.close()
    # 同じURLの重複を除去
    out = []
    seen = set()
    for city, url in p.items:
        if url not in seen:
            seen.add(url)
            out.append((city, url))
    return out


def parse_store_names(text: str):
    p = StoreH2Parser()
    p.feed(text)
    p.close()
    out = []
    seen = set()
    for item in p.items:
        name = item['name']
        # 店舗名h2以外が混ざった場合に最低限除外
        if not name or name in ('P-WORLD', 'パチンコ店情報', '機種インデックス', '求人インデックス'):
            continue
        key = name
        if key not in seen:
            seen.add(key)
            out.append({'store': name, 'url': item['url'], 'rates': item.get('rates', [])})
    return out


def main():
    delay = float(sys.argv[1]) if len(sys.argv) > 1 else 0.12
    # --verify-details を指定すると全店舗の詳細ページも確認する。
    # 通常は一覧ページで貸出条件が取れなかった店舗だけ詳細ページを確認する。
    verify_details = '--verify-details' in sys.argv[1:]
    print('============================================', flush=True)
    print('  P-WORLD 店舗データ更新 Ver8.28', flush=True)
    print('============================================', flush=True)
    print('「都道府県 → 市区郡 → 店舗一覧」の順で店舗と貸出条件を取得します。', flush=True)
    if verify_details:
        print('詳細ページ検証モード: 全店舗の店舗詳細ページも確認します。', flush=True)
    else:
        print('通常モード: 一覧ページで貸出条件が取れない店舗だけ詳細ページを確認します。', flush=True)

    all_rows = []
    seen = set()
    total_cities = 0
    pref_ok = 0
    failures = []
    detail_checked = 0
    detail_filled = 0
    detail_failed = 0

    for pi, pref in enumerate(PREFS, 1):
        slug = PREF_SLUGS[pref]
        pref_url = f'{BASE}/{slug}/'
        try:
            pref_text = fetch(pref_url)
            city_links = parse_city_links(pref_text)
            if not city_links:
                # 末尾スラッシュなしも試す
                pref_text = fetch(f'{BASE}/{slug}', referer=pref_url)
                city_links = parse_city_links(pref_text)
            print(f'[{pi:>2}/47] {pref}: 市区郡 {len(city_links)}件', flush=True)
            if not city_links:
                failures.append(f'{pref}: 市区郡リンク0件')
                continue
            pref_ok += 1
            total_cities += len(city_links)
        except Exception as e:
            failures.append(f'{pref}: 都道府県ページ取得失敗: {e}')
            print(f'[{pi:>2}/47] {pref}: ERROR {e}', flush=True)
            continue

        for ci, (city, city_url) in enumerate(city_links, 1):
            try:
                text = fetch(city_url, referer=pref_url)
                stores = parse_store_names(text)
                for s in stores:
                    rates = s.get('rates', []) or []
                    # 通常は一覧ページで取れなかった店舗だけ詳細ページへ。
                    # --verify-details では全店舗を詳細ページでも確認する。
                    if s.get('url') and (verify_details or not rates):
                        detail_checked += 1
                        try:
                            detail_text = fetch(s['url'], referer=city_url)
                            detail_rates = parse_store_detail_rates(detail_text)
                            merged = merge_rates(rates, detail_rates)
                            if not rates and detail_rates:
                                detail_filled += 1
                            rates = merged
                        except Exception as e:
                            detail_failed += 1
                            # 詳細ページ取得失敗時は一覧ページの取得結果を維持する。
                            print(f'      [DETAIL WARN] {s["store"]}: {e}', flush=True)

                    key = (pref, city, s['store'])
                    if key not in seen:
                        seen.add(key)
                        all_rows.append({
                            'prefecture': pref,
                            'city': city,
                            'store': s['store'],
                            'url': s['url'] or '',
                            'rates': rates
                        })
                rate_count=sum(len(x.get('rates',[])) for x in stores)
                missing_count=sum(1 for x in stores if not x.get('rates'))
                print(f'    {ci:>3}/{len(city_links)} {city}: {len(stores)}店舗 / 貸出条件 {rate_count}件 / 未取得 {missing_count}店舗 / 累計 {len(all_rows)}店舗', flush=True)
            except Exception as e:
                failures.append(f'{pref} {city}: {e}')
                print(f'    {ci:>3}/{len(city_links)} {city}: ERROR {e}', flush=True)
            time.sleep(delay)

    print(f'\n都道府県ページ取得成功: {pref_ok}/47', flush=True)
    print(f'市区郡ページ数: {total_cities}', flush=True)
    print(f'店舗名取得数: {len(all_rows)}', flush=True)
    print(f'詳細ページ確認数: {detail_checked}店舗 / 補完成功: {detail_filled}店舗 / 詳細取得失敗: {detail_failed}店舗', flush=True)

    if not all_rows:
        print('\n[NG] 店舗名を1件も取得できませんでした。既存データは変更しません。', file=sys.stderr)
        return 3

    # P-WORLDトップで現在確認できる登録店舗数と大きく乖離していれば更新しない。
    # 市区郡ページ方式なので、多少の取得失敗を許容しつつ90%を安全ラインにする。
    expected = 5778
    if len(all_rows) < int(expected * 0.9):
        print(f'\n[NG] 取得数が少なすぎます: {len(all_rows)} / 目安 {expected}', file=sys.stderr)
        print('既存のstore-data.jsonは変更しません。', file=sys.stderr)
        if failures:
            print(f'失敗/未取得: {len(failures)}件', file=sys.stderr)
        return 4

    all_rows.sort(key=lambda x: (x['prefecture'], x['city'], x['store']))
    now = datetime.now(JST)
    payload = {
        'version': now.strftime('%Y%m%d%H%M%S'),
        'updatedAt': now.isoformat(),
        'source': 'P-WORLD 市区郡ページ',
        'stores': all_rows,
    }
    path = Path(__file__).with_name('store-data.json')
    tmp = path.with_suffix('.json.tmp')
    tmp.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding='utf-8')
    if path.exists():
        backup = path.with_name('store-data.backup-' + now.strftime('%Y%m%d-%H%M%S') + '.json')
        path.replace(backup)
    tmp.replace(path)

    print(f'\n[OK] 更新完了: {len(all_rows)}店舗', flush=True)
    if failures:
        print(f'[WARN] 取得失敗/未取得: {len(failures)}件', flush=True)
        for x in failures[:20]:
            print(' - ' + x, flush=True)
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
