# Identity requests

The public push gate is deny-by-default. Only identities listed in
`.github/hooks/approved-identities.json` may author or commit new work.

To request another contributor:

1. Open a pull request with the proposed name, email, GitHub login, scope, and
   reason in this document or a new `docs/identity-requests/<id>.md` file.
2. Do not edit `approved-identities.json` in the request.
3. The request must be explicitly approved by `TechSecWhisperer` in the pull
   request review.
4. Only after that approval may the owner add the exact identity tuple to the
   allowlist in a separate commit or follow-up pull request.

A request file never grants access by itself. The hook reads only the committed
allowlist, and rejects every identity tuple not present there. Never use
`git push --no-verify` to bypass this gate.
