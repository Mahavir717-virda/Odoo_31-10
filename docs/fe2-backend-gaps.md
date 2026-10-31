# FE2 backend gaps

The frontend uses the existing API contracts and does not fabricate endpoints.

## Customer subscription lifecycle actions

The customer portal can read the authenticated customer's subscriptions through
`GET /subscriptions` and `GET /subscriptions/:id`. The only status mutation is
`PATCH /subscriptions/:id/status`, which is restricted to `ADMIN` and `STAFF`
and supports the `DRAFT -> QUOTATION -> CONFIRMED -> ACTIVE -> CLOSED`
workflow. There are no customer-authorized pause, resume, or close operations.
The portal therefore displays subscription details but does not offer these
actions.

## Dashboard aggregation

There is no dashboard or reports endpoint in the current backend routes or API
contract. The dashboard aggregates existing subscription, payment, and invoice
list endpoints instead. This is functional with the current API but requires
multiple paginated requests; a dedicated reporting endpoint could reduce that
load as account volumes grow.

## Staff and profile mutations

The users API currently supports listing users and creating staff members only.
It has no staff update/delete routes. The authentication API exposes
`GET /auth/me` for the current profile but no profile-update route. The
frontend therefore does not present mutations that the backend cannot persist.

## Tenant isolation

The checked-in database schema has no tenant or company identifier, and the
authentication contract does not provide a tenant context. Tenant-level data
isolation cannot be implemented or verified without backend and schema support.
Customer-level authorization remains enforced by the existing authenticated
user/role rules.
