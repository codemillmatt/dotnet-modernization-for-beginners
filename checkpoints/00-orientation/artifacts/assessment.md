# Model assessment: SimpleLegacyApp

This is a representative output, not a guaranteed transcript.

| Evidence | Category | Priority decision | Validation |
|---|---|---|---|
| `ConfigurationManager.AppSettings` | Source incompatibility for the chosen target | Required for compilation after replacement | Configuration test with missing/default values |
| `HttpContext.Current` | Source and architecture incompatibility | Required; request lifetime is exposed | Concurrent request and missing-context tests |
| `BinaryFormatter` | Removed and unsafe serialization model | Critical if untrusted data reaches it | Reject untrusted payloads; compatibility test for approved replacement |

Counts are inventory only. The serialization finding can outweigh multiple
mechanical compile findings because security and persisted-data compatibility
change the required response.
