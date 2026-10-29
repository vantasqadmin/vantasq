# 0014. Do not name where the team is based

Status: Accepted
Date: 2026-10-29

## Context

[0002](0002-outsourcing-positioning.md) sold "dedicated Philippine
specialists", and the copy, titles, meta descriptions, JSON-LD
(`addressCountry: PH`), office hours (PHT) and share image all said so. With
the move to the Vantasq brand, the site no longer names the country the team
works from.

## Decision

The outsourcing positioning from 0002 stays: dedicated specialists who work
the client's hours, recruited and managed by us. The site does not mention the
Philippines, Filipino staff, Manila, Philippine time or any other location of
the team, in copy, metadata, JSON-LD or images. Organization JSON-LD carries no
`address`. `tools/check-site.js` fails a page that mentions the Philippines.

## Consequences

- Copy describes the team as dedicated, remote and English-fluent instead of by
  country; office hours are given without a time zone.
- The home page globe still starts its routes from the team's home point. Its
  alt text and visible copy do not name it.
- If a location is ever named again, write a note that supersedes this one.

## Related

- [0002. Position as an offshore outsourcing partner](0002-outsourcing-positioning.md)
- [0004. Only claims we can stand behind](0004-only-defensible-claims.md)
