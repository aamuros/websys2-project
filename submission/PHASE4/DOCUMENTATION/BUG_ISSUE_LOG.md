# Phase 4 - Bug / Issue Log

| ID | Bug/issue | Description | Severity | Action taken | Status | Evidence |
| --- | --- | --- | --- | --- | --- | --- |
| BUG-01 | Server registration accepted a one-character name | Browser minLength=2 was bypassable; server had no equivalent minimum. | Low | Added min:2 to RegisterRequest; added VAL03 regression; backend and browser retested. | Resolved | security-before.xml, final phpunit-results.xml, 17-name-validation-fixed.png |
| DOC-01 | Actual usability feedback missing | At least three real tester sessions still needed. | Submission gap | Prepared procedure and feedback forms. | Pending | USABILITY_TESTING.md |
| DOC-02 | Member ratings and contributions missing | Leader/assistant leader must supply and approve details. | Submission gap | Prepared contribution/rating form. | Pending | MEMBER_CONTRIBUTIONS.md |

Add newly discovered issues here with actual evidence. No unresolved critical defect was identified in the executed test scope; untested deployment conditions remain outside that conclusion.
