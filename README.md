# SANVI COMPUTER AND TRADERS

- `backend/` — Node.js + Express API (port 5050)
- `website/` — React + Vite website (port 5173, `/api` proxied to the backend)

## Setup

```bash
make install   # deps + backend/.env
make run       # backend + website together (Ctrl+C stops both)
```

Run `make` to see all commands (`make backend`, `make website`, `make stop`, `make status`, ...).

## Payment methods (Nepal)

Payments use Nepal's payment methods everywhere (institute fee payments, Sanvi bills and supplier payments): Cash, eSewa, Khalti, Fonepay QR, connectIPS, Mobile banking, Bank deposit / transfer, Cheque, Card (POS). UPI and "Online" were removed. The list lives in `backend/src/constants/enums.js` (`PAYMENT_MODE`) and `website/src/constants/institute.js` (`PAYMENT_MODE_LABELS`); keep both in sync.
