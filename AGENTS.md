# Architecture rules

- Enforce permanent application-record retention in both database triggers/defaults and client queries; legacy expiration fields are deprecated and must not hide or delete records, so older saved data remains accessible.