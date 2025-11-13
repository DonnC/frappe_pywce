# Frappe Pywce
A complete WhatsApp chatbot engine in frappe powered by [Pywce](https://github.com/DonnC/pywce)

![builder](screenshots/builder.png)

![emulator](screenshots/emulator.png)

## Features
- [x] Create a chatbot from frappe desk UI
- [x] Visual WhatsApp flow builder
- [x] Chatbot changes reflect instantly on WhatsApp
- [x] Improved performance via background processing using `frappe.enqueue(...)`
- [x] Comes with out-of-the-box local WhatsApp emulator to test without WhatsApp live connection
- [x] Support for all features of pywce

## Setup
Install app 
```bash
$ bench get-app --branch main frappe_pywce https://github.com/DonnC/frappe_pywce.git

# install on site
$ bench --site `site-name` install-app frappe_pywce
```

### Configure
On AwesomeBar, search for  to `ChatBot Config` to add your whatsapp / chatbot configs


![configs](screenshots/config.png)

### ChatBot UI Builder
To build chatbot locally using builder
1. Navigate to bench folder
2. Navigate to app folder `cd apps/frappe_pywce`
3. Setup dev `yarn dev`
4. The web uis will run, you will see an output as below

![terminal](screenshots/terminal.png)

- Access builder ui on port `8080` and emulator ui will be on port `8081`


### Production build
For a production build, it's a single command via bench
```bash
$ bench build --app frappe_pywce
```

> Your production build `builder` ui will be available on `http://your-frappe-site.com/builder`

> If all goes well, you will have the same screens as on the demo above!

---


## Support
Need a ChatBot for your business or next project! or just to say Hello - Let's get in touch via [email](donychinhuru@gmail.com)

## Documentation

Visit the [official wce documentation](https://docs.page/donnc/wce/frappe) for a detailed guide.

## Contributing

We welcome contributions! Please check out the [Contributing Guide](CONTRIBUTING.md) for details.

The UIs where largely vibe-coded using Lovable (React)

## License

This project is licensed under the MIT License. See the [LICENSE](license.txt) file for details.

