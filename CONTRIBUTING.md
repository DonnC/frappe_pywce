# Contributing to pywce

Thank you for considering contributing to frappe-pywce! 

By contributing, you're helping improve a robust app designed for building WhatsApp chatbots of any scale effortlessly using the frappe framework.

## Getting Started

### Prerequisites
Ensure you have the following installed before contributing:
- Python 3+
- Frappe v15+ (ERPNext is optional)
- An active [TEST] WhatsApp Cloud API setup with the necessary tokens and configurations.

### Setting Up the Project
Ensure frappe is setup properly before procedding

Install app 
```bash
$ bench get-app frappe_pywce https://github.com/DonnC/frappe_pywce.git

# install on site
$ bench --site `site-name` install-app frappe_pywce
```


## Contribution Workflow

### 1. Reporting Issues
If you encounter any bugs, feature requests, or documentation issues, please [open an issue](https://github.com/DonnC/frappe_pywce/issues).

### 2. Suggesting Features
- The **frappe-pywce** (this frappe app) for the main frappe project for building chatbots.

### 3. Making Changes
- Before you start coding, create a new branch for your changes:
  ```bash
  git checkout -b feature/my-new-feature
  ```
- Keep your changes modular and adhere to or improve the existing coding style. 
- Ensure you add comments where necessary.

### 4. Running Tests
Refer to frappe framework testing

### 5. Submitting Your Changes
- Commit your changes with meaningful messages:
  ```bash
  git commit -m "Add feature: Support for doc events"
  ```
- Push your branch to your forked repository:
  ```bash
  git push origin feature/my-new-feature
  ```
- Open a pull request from your branch to the `main` branch of the original repository.

## Special Contributions for PyWCE
> Checkout the core `pywce` library [contributing guide here](https://github.com/DonnC/pywce/blob/master/CONTRIBUTING.md)


### Extending the WhatsApp Client Library
The core library `pywce.whatsapp` module provides direct API integration. If you'd like to add more features:
- Use the `WhatsApp` class in `pywce/modules/whatsapp/__init__.py` as your base.
- Add well-documented methods for new API endpoints.

### Adding New Pywce Features
The engine processes chatbot logic via templates. When adding new engine capabilities:
- Add corresponding engine logic in corresponding folder under `pywce/src/`.
- Document new template options or hooks clearly in `CHANGELOG` and or `README`.

## Getting Help
If you're stuck or have any questions, don't hesitate to open a discussion on the [GitHub Discussions page](https://github.com/DonnC/frappe_pywce/discussions).

Thank you for contributing to Frappe Pywce