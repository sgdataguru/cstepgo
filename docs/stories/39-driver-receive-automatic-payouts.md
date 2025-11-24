# User Story: 7 - Driver Receive Automatic Payouts

**As a** driver,  
**I want** to receive my earnings automatically in regular payouts,  
**so that** I don't have to manually request payments and can trust the platform with my income.

## Acceptance Criteria

* Driver can configure or verify their payout details (e.g., bank account or connected Stripe account) in the driver portal.
* In the **Earnings** section of the driver portal, the driver can see:
  * Total earnings for a selected period,
  * Upcoming scheduled payout amount and date,
  * History of past payouts (date, amount, status).
* The system periodically (e.g., weekly or monthly) calculates:
  * Total eligible earnings for each driver for the period,
  * Platform commission and fees,
  * Net payout amount.
* For each driver payout run:
  * A payout record is created with status (e.g., `pending`, `processing`, `paid`, `failed`).
  * The payment provider (e.g., Stripe Connect) is called to transfer funds.
* On successful payout:
  * Payout status is updated to `paid`,
  * The driver sees the payout in their payout history.
* On payout failure:
  * Status is updated to `failed`,
  * Driver sees an explanatory message and can update payout details if needed.
* Payout calculations respect:
  * Trip completion status,
  * Cancellations and refunds,
  * Any configured withholding or delay rules.

## Notes

* Tax reporting and advanced compliance details can be handled in later stories.
