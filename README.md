# Frappe Pywce
A WhatsApp chatbot engine in frappe powered by [Pywce](https://github.com/DonnC/pywce)

![workspace](screenshots/home.png)

## Features
- [x] Create a chatbot from frappe desk UI
- [x] Doctype driven chatbot
- [x] Chatbot changes reflect instantly on WhatsApp
- [x] Improved performance via background processing using `frappe.enqueue(...)`
- [x] Frappe dependent business logic via server side scripts-like approach or directly on UI
- [x] Support for all features of pywce

## Setup
Install app 
```bash
$ bench get-app --branch main frappe_pywce https://github.com/DonnC/frappe_pywce.git

# install on site
$ bench --site `site-name` install-app frappe_pywce
```

### Configure
Navigate to `app settings > Configs` to add your whatsapp configs


![configs](screenshots/config.png)

### Web UIs
One-Time Setup

```bash
$ cd apps/frappe-pywce

$ npm run install-all
```

Development (All apps + bridge)

Terminal 1: `bench start`

Terminal 2: (from apps/frappe-pywce/) `npm run dev`

Access:
 Emulator: http://localhost:8080
 Builder:  http://localhost:8081

Production Build

Just run: `bench build --app frappe-pywce`

This will automatically trigger `build.py`, which in turn runs yarn build in both app folders, creating the public/ assets and the www/ HTML files.

Access:
 Emulator: http://your-frappe-site.com/emulator
 Builder:  http://your-frappe-site.com/builder

## Documentation

Visit the [official wce documentation](https://docs.page/donnc/wce/frappe) for a detailed guide.

## Contributing

We welcome contributions! Please check out the [Contributing Guide](CONTRIBUTING.md) for details.

## License

This project is licensed under the MIT License. See the [LICENSE](license.txt) file for details.

