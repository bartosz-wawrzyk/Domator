import csv
import io
import hashlib
from datetime import datetime
from decimal import Decimal
from typing import List, Dict, Any

class FinanceService:
    SUPPORTED_BANKS = ['MBANK', 'SANTANDER']

    @staticmethod
    def generate_raw_hash(date_str: str, amount: str, title: str, count: int) -> str:
        payload = f"{date_str}|{amount}|{title}|{count}"
        return hashlib.sha256(payload.encode()).hexdigest()

    @staticmethod
    def clean_amount(amount_str: str) -> Decimal:
        if not amount_str:
            return Decimal("0.00")
        cleaned = (amount_str.replace("'", "")
                           .replace("PLN", "")
                           .replace(" ", "")
                           .replace("\xa0", "")
                           .replace(",", ".")
                           .strip())
        return Decimal(cleaned)

    @classmethod
    def parse_csv(cls, content: str, bank_type: str = None) -> List[Dict[str, Any]]:
        if not bank_type or bank_type.upper() not in cls.SUPPORTED_BANKS:
            supported_str = ", ".join(cls.SUPPORTED_BANKS)
            raise ValueError(f"Bank ‘{bank_type}’ is not yet supported. Supported banks: {supported_str}")

        transactions = []
        f = io.StringIO(content.strip())
        reader = csv.reader(f, delimiter=';')
        
        seen_count = {}
        parsing_started = False
        bt_upper = bank_type.upper()

        for row in reader:
            if not row:
                continue

            if bt_upper == 'SANTANDER':
                if "Data operacji" in row[0]:
                    parsing_started = True
                    continue
                
                if not parsing_started:
                    try:
                        datetime.strptime(row[0], "%d-%m-%Y")
                        parsing_started = True
                    except ValueError:
                        continue

                try:
                    date_val = datetime.strptime(row[0], "%d-%m-%Y")
                    title = f"{row[2]} {row[3]}".strip()
                    amount = cls.clean_amount(row[5])
                except (ValueError, IndexError):
                    continue

            elif bt_upper == 'MBANK':
                if "#Data księgowania" in row[0] or "Data operacji" in row[0]:
                    parsing_started = True
                    continue

                if not parsing_started:
                    continue

                try:
                    date_str = row[1] if "-" in row[1] else row[0]
                    date_val = datetime.strptime(date_str, "%Y-%m-%d")
                    title = f"{row[2]} {row[3]}".strip()
                    
                    amount_raw = row[6] if len(row) > 7 and "," in row[6] else row[5]
                    amount = cls.clean_amount(amount_raw)
                except (ValueError, IndexError):
                    continue

            if parsing_started:
                date_iso = date_val.strftime('%Y-%m-%d')
                temp_key = f"{date_iso}|{amount}|{title}"
                seen_count[temp_key] = seen_count.get(temp_key, 0) + 1
                
                final_hash = cls.generate_raw_hash(
                    date_iso, 
                    str(amount), 
                    title, 
                    seen_count[temp_key]
                )

                transactions.append({
                    "date": date_val,
                    "title": title, 
                    "amount": float(amount),
                    "raw_hash": final_hash,
                    "category_id": None
                })
                
        return transactions

    @staticmethod
    def match_categories(transactions: List[Dict[str, Any]], rules: List[Any]) -> List[Dict[str, Any]]:
        for tx in transactions:
            title_upper = tx["title"].upper()
            for rule in rules:
                if rule.keyword.upper() in title_upper:
                    tx["category_id"] = rule.category_id
                    break 
        return transactions