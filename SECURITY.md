
# Security Policy

## 1. Document Control & Compliance Mapping
This Security Policy outlines the vulnerability management, flaw remediation, and software assurance requirements for the **auth51-console** repository. This document is structured to fulfill the organizational requirements of **NIST SP 800-53 Rev. 5** within the System and Information Integrity (SI), Risk Assessment (RA), Incident Response (IR), and System and Services Acquisition (SA) control families.

| NIST SP 800-53 Rev. 5 Control | Control Name | Project Implementation |
| :--- | :--- | :--- |
| **SI-2** | Flaw Remediation | Identification, reporting, and patching of software vulnerabilities. |
| **SI-5** | Security Alerts, Advisories, and Directives | Generation of public advisories following patch deployment. |
| **SI-7** | Software, Firmware, and Information Integrity | Verification of code integrity through cryptographic signatures and checksums. |
| **RA-5** | Vulnerability Monitoring and Scanning | Ingestion of external vulnerability reports and automated repository scanning. |
| **IR-4** | Incident Handling | Ingestion, verification, and containment planning for reported exploits. |
| **IR-6** | Incident Reporting | Formal pathways for reporting security incidents securely to stakeholders. |
| **SA-11** | Developer Testing and Evaluation | Static Application Security Testing (SAST) and automated dependency analysis. |

## 2. Developer Testing & Verification (SA-11, Developer Testing and Evaluation)
In alignment with **SA-11**, the **auth51-console** development lifecycle integrates verification tools to reduce security flaws prior to production releases.

* **Static Analysis:** Automated Static Application Security Testing (SAST) scanners run on every pull request to analyze source code for injection vectors, cryptographic weaknesses, and logical flaws.
* **Dependency Scanning:** Automated Software Bill of Materials (SBOM) and software composition scanners continuously evaluate external packages against known vulnerability databases (NVD/GitHub Advisory Database).
* **Branch Protections:** Code cannot be merged into the `main` branch without passing all automated security checkpoints and obtaining peer-review approval.

## 3. Software Integrity Assurance (SI-7, Software, Firmware, and Information Integrity)
To satisfy **SI-7** guidelines, the project maintainers enforce controls to protect against unauthorized modifications and supply chain tampering.

* **Commit and Tag Signing:** All production release tags and main-branch commits must be cryptographically signed using GPG or SSH keys verified by GitHub. Unsigned contributions to protected branches are blocked.
* **Artifact Verification:** Published release artifacts are accompanied by cryptographic checksums (e.g., SHA-256) to allow users to verify software integrity prior to deployment.

## 4. Supported Versions (SI-2, Flaw Remediation)
In compliance with **SI-2**, the project maintainers actively monitor, patch, and remediate security vulnerabilities for system components. Maintenance is restricted to the operational life cycle baselines defined below.

| Version | Supported | Security Maintenance Level |
| :--- | :---: | :--- |
| **Main / Current** | :white_check_mark: | Full active remediation (High-priority and critical patches). |
| **< Release-v1.0** | :x: | Unsupported. Security monitoring has ceased; risk accepted by user. |

## 5. Vulnerability Reporting Pathways (IR-6, Incident Reporting)
To satisfy the confidentiality requirements of **IR-6**, vulnerabilities must be reported through controlled communication channels to prevent premature public disclosure and minimize organizational exposure.

**Do not open public GitHub Issues, Pull Requests, or Discussions regarding a suspected security vulnerability.**

### Preferred Channel: GitHub Private Vulnerability Reporting
1. On GitHub.com, navigate to the main page of the **auth51-console** repository.
2. Under the repository name, click the **Security** tab.
3. In the left sidebar, under **Reporting**, click **Vulnerability disclosure**.
4. Click **Report a vulnerability** to open the secure advisory form.

### Alternate Channel: Designated Encrypted Email Ingestion
If the primary GitHub reporting mechanism is inaccessible, route your disclosure to the dedicated intake authority:
* **Point of Contact:** unforge-io Security Team
* **Inbound Address:** [security@unforge.io](mailto:security@unforge.io)

## 6. Disclosure Ingestion Baseline (RA-5, Vulnerability Monitoring)
When submitting a report to satisfy **RA-5** ingestion standards, ensure the following technical documentation is included to facilitate rapid analysis:

* **Technical Description:** Comprehensive summary of the vulnerability, execution context, and potential operational impact.
* **Proof of Concept (PoC):** Step-by-step reproduction instructions or code snippets required to manifest the vulnerability.
* **Component Tracking:** Specific commit hashes, dependencies, configuration state, and environmental factors validated during testing.

## 7. Incident Response & Advisory Timeline (IR-4, SI-5)
The engineering team executes an incident response protocol modeled after **IR-4** upon receipt of a security report:

1. **Receipt & Ingestion (IR-6):** Formal acknowledgement of the vulnerability report within **3 business days**.
2. **Analysis & Containment (RA-5 / IR-4):** Technical evaluation within an isolated staging environment to determine severity, reachability, and potential systemic blast radius.
3. **Remediation Engineering (SI-2):** Development, verification, and code-signing of an emergency software patch or deterministic configuration mitigation.
4. **Coordinated Disclosure (SI-5):** Publication of a GitHub Security Advisory (GHSA) detailing the vulnerability mechanics, CVE designation, remediation steps, and upgraded software dependencies.

