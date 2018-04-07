class UriwriterSingleton {
    constructor(key) {
        console.log('setting up new uriwriter');
        this.uristowrite = [];
        this.key = key;
        this.uri = document.querySelectorAll('.uriwriter');
        console.log(this.uri);
        this.uriwriter = {};
        this.uristring = 'mongodb://$[username]:$[password]@$[hostlist]/$[database]?$[options]';
        this.urireplacestring = '';
        this.templates = [];
        this.templates['self-managed MongoDB'] = {
            'options': [
                {'authdb': 'text'}
            ],
            'template': 'mongodb://$[username]:$[password]@$[hostlist]/$[database]?$[options]'
        };
        this.templates['replica set'] = {
            'options': [
                {'replicaSet': '[text]'},
                {'authSource': '[text]'},
                {'ssl': 'true'}
            ],
            'template': 'mongodb://$[username]:$[password]@$[hostlist]/$[database]?$[options]'
        };
        this.templates['Atlas (Cloud) v. 3.6'] = {'template': 'mongodb+srv://$[username]:$[password]@$[hostlist]/$[database]?$[options]'};
        this.templates['Atlas (Cloud) -- Free Tier (3.4)'] = {
            'options': [
                {'authSource': '[text]'},
                {'ssl': 'true'}
            ],
            'template': 'mongodb://$[username]:$[password]@$[hostlist]/$[database]?$[options]'
        };
        this.renderURI();
    }

    get uriwriter() {
        return JSON.parse(window.localStorage.getItem(this.key)) || {};
    }

    set uriwriter(value) {
        const uriwriter = value;
        window.localStorage.setItem(this.key, JSON.stringify(uriwriter));
    }

    addValue(key, value) {
        const uriwriter = this.uriwriter;
        uriwriter[key] = value;
        this.uriwriter = uriwriter;
    }

    renderURI() {
        if (this.uriwriter.env === undefined) {
            console.log('uriwriter env is undefined');
            const uriwriter = {};
            uriwriter.env = 'self-managed MongoDB';
            this.uriwriter = uriwriter;
        }
        console.log(this.uriwriter.env);
        const template = this.templates[this.uriwriter.env].template;
        console.log(template);
        this.uristring = template;
        this.urireplacestring = this.replaceString();
        this.uristring = this.urireplacestring;
        if (template.options && template.options.length > 0) {
            // console.log('render dynamic fields');
        }
        this.writeToPlaceholders();
    }

    writeToPlaceholders() {
        for (let i = 0; i < this.uristowrite.length; i += 1) {
            this.uristowrite[i].innerHTML = this.uristowrite[i].innerHTML.replace(this.replaceKey, this.urireplacestring);
        }
        this.replaceKey = this.urireplacestring;
    }


    setupURIListeners() {
        const list = document.getElementsByTagName('pre');
        for (let i = 0; i < list.length; i += 1) {
            if (list[i].innerHTML.indexOf('&lt;URISTRING&gt;') > -1) {
                this.uristowrite.push(list[i]);
                this.replaceKey = '&lt;URISTRING&gt;';
            }
        }
        console.log(this.uristowrite);
    }

    replaceString() {

        let repl = this.uristring;

        if (this.uriwriter.username) {
            repl = repl.replace('$[username]', this.uriwriter.username);
        }
        if (this.uriwriter.database) {
            console.log('FOUND DATA');
            repl = repl.replace('$[database]', this.uriwriter.database);
        }
        if (this.uriwriter.authdatabase) {
            repl = repl.replace('$[authdatabase]', this.uriwriter.authdatabase);
        }

        let hostport = '';

        if (this.uriwriter.hostlist && this.uriwriter.hostlist.length > 0) {
            hostport = `${this.uriwriter.hostlist[0]}`;
            for (let i = 1; i < this.uriwriter.hostlist.length; i += 1) {
                hostport += `,${this.uriwriter.hostlist[i]}`;
            }
            repl = repl.replace('$[hostlist]', hostport);
        }
        this.addOptions(repl);
        document.getElementById('uri').innerHTML = repl;
        return repl;
    }


    addOptions(repl) {
        this.options = this.templates[this.uriwriter.env].options;
        console.log(this.options);
    }

    setup() {
        document.getElementById('uri').innerHTML = this.uristring;
        document.getElementById('uriwriter_act').addEventListener('click', (event) => {
            this.addHostEntryToList();
            this.renderURI();
            event.preventDefault();
        });

        document.getElementById('uriwriter_username').addEventListener('keyup', (event) => {
            this.addValue('username', document.getElementById('uriwriter_username').value);
            this.renderURI();
        });

        document.getElementById('uriwriter_sel').addEventListener('click', (event) => {
            const e = event.srcElement.innerHTML;
            this.addValue('env', e);
            document.getElementById('uriwriter_env').innerHTML = e;
            this.renderURI();
            event.preventDefault();
        });

        document.getElementById('uriwriter_db').addEventListener('keyup', (event) => {
            this.addValue('database', document.getElementById('uriwriter_db').value);
            this.renderURI();
        });

        document.getElementById('uriwriter_authdb').addEventListener('keyup', (event) => {
            this.addValue('authdatabase', document.getElementById('uriwriter_authdb').value);
            this.renderURI();
        });
        this.addValue('env', 'self-managed MongoDB');
        document.getElementById('uriwriter_env').innerHTML = 'self-managed MongoDB';
        this.setupURIListeners();
        this.renderURI();
    }

    resetForm() {
        document.getElementById('hostname').value = '';
        document.getElementById('port').value = '';
    }


    addHostEntryToList() {


        const hostname = document.getElementById('hostname').value;
        const ip = document.getElementById('port').value;

        if (hostname === '' ||
            ip === '') { return; }

        this.resetForm();
        this.persistList(hostname, ip);
    }

    persistList(host, ip) {

        const template = `${host}:${ip}`;
        const uriwriter = this.uriwriter;

        if (uriwriter.hostlist) {
            const hostlist  = uriwriter.hostlist;
            if (hostlist.indexOf(template) < 0) {
                hostlist.push(template);
                uriwriter.hostlist = hostlist;
            } else {
                return;
            }
        } else {
            const array = [];
            array.push(template);
            uriwriter.hostlist = array;
        }

        this.uriwriter = uriwriter;
        this.renderList(template);
    }

    renderList(template) {
        const hostpair = document.createElement('li');
        hostpair.setAttribute('id', template);
        hostpair.setAttribute('class', 'hostpair');
        hostpair.innerHTML = template;
        const button = document.createElement('button');
        button.innerHTML = 'X';
        button.setAttribute('class', 'littlebutton');
        button.setAttribute('id', template);
        button.addEventListener('click', (event) => {
            const uriwriter = this.uriwriter;
            const localStorage = uriwriter.hostlist;
            const removeIndex = localStorage.indexOf(event.srcElement.id);
            if (removeIndex > -1) {
                localStorage.splice(removeIndex, 1);
            } else {
                return;
            }
            uriwriter.hostlist = localStorage;
            this.uriwriter = uriwriter;
            hostpair.outerHTML = '';
            this.renderURI();
        });
        hostpair.appendChild(button);
        document.getElementById('hostlist').appendChild(hostpair);
    }
}

// Create Uriwriter
export function setup() {
    console.log('setting up uriwriter');
    (new UriwriterSingleton('uriwriter')).setup();
}
