# Security Policy

## 1. Document Control & Compliance Mapping
This Security Policy outlines the vulnerability management and flaw remediation requirements for the **auth51-console** repository. This document is structured to fulfill the organizational requirements of **NIST SP 800-53 Rev. 5** within the System and Information Integrity (SI), Risk Assessment (RA), and Incident Response (IR) control families.

| NIST SP 800-53 Rev. 5 Control | Control Name | Project Implementation |
| :--- | :--- | :--- |
| **SI-2** | Flaw Remediation | Identification, reporting, and patching of software vulnerabilities. |
| **RA-5** | Vulnerability Monitoring and Scanning | Ingestion of external vulnerability reports and coordination of fixes. |
| **IR-4** | Incident Handling | Ingestion, verification, and containment planning for reported exploits. |
| **IR-6** | Incident Reporting | Formal pathways for reporting security incidents securely to stakeholders. |
| **SI-5** | Security Alerts, Advisories, and Directives | Generation of public advisories following patch deployment. |

## 2. Supported Versions (SI-2, Flaw Remediation)
In compliance with **SI-2**, the project maintainers actively monitor, patch, and remediate security vulnerabilities for system components. Maintenance is restricted to the operational life cycle baselines defined below.

| Version | Supported | Security Maintenance Level |
| :--- | :---: | :--- |
| **Main / Current** | :white_check_mark: | Full active remediation (High-priority and critical patches). |
| **< Release-v1.0** | :x: | Unsupported. Security monitoring has ceased; risk accepted by user. |

## 3. Vulnerability Reporting Pathways (IR-6, Incident Reporting)
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

## 4. Disclosure Ingestion Baseline (RA-5, Vulnerability Monitoring)
When submitting a report to satisfy **RA-5** ingestion standards, ensure the following technical documentation is included to facilitate rapid analysis:

* **Technical Description:** Comprehensive summary of the vulnerability, execution context, and potential operational impact.
* **Proof of Concept (PoC):** Step-by-step reproduction instructions or code snippets required to manifest the vulnerability.
* **Component Tracking:** Specific commit hashes, dependencies, configuration state, and environmental factors validated during testing.

## 5. Incident Response & Advisory Timeline (IR-4, SI-5)
The engineering team executes an incident response protocol modeled after **IR-4** upon receipt of a security report:

1. **Receipt & Ingestion (IR-6):** Formal acknowledgement of the vulnerability report within **3 business days**.
2. **Analysis & Containment (RA-5 / IR-4):** Technical evaluation within an isolated staging environment to determine severity, reachability, and potential systemic blast radius.
3. **Remediation Engineering (SI-2):** Development, verification, and code-signing of an emergency software patch or deterministic configuration mitigation.
4. **Coordinated Disclosure (SI-5):** Publication of a GitHub Security Advisory (GHSA) detailing the vulnerability mechanics, CVE designation, remediation steps, and upgraded software dependencies.
