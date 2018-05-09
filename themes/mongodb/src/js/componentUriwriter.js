class UriwriterSingleton {
    constructor(key) {

        // an array of DOM objects that care about changes to the URI
        this.uristowrite = [];
        this.usernamestowrite = [];
        this.uristowritepasswordredactedshell = [];
        this.uristowriteshell = [];
        this.uristowritenode = [];
        // this is the localCache key
        this.key = key;
        // this.uristringPasswordRedacted = 'mongodb://$[hostlist]/$[database]?$[options]';
        this.urireplacestring = '';
        this.urireplaceStringShell = '';
        this.urireplaceStringNode = '';
        this.urireplaceStringPasswordRedactedShell = '';
        this.templates = [];
        this.options = {};
        // load reference data
        this.selfManaged = 'on-premise MongoDB';
        this.replicaSet = 'on-premise MongoDB with replica set';
        this.atlas3dot6 = 'Atlas (Cloud) v. 3.6';
        this.atlas3dot4 = 'Atlas (Cloud) v. 3.4';
        // load the model
        this.loadTemplates();
        // setup listeners on the page to changes in uri fields (view)
        this.setupURIListeners();
        // calculate and propagate the URI (controller)
        if (this.uriwriter.env === undefined) {
            const uriwriter = {};
            uriwriter.env = this.selfManaged;
            this.uriwriter = uriwriter;
        }
        this.renderURI();
        this.populateForm();
    }

    // all the things -- model
    loadTemplates() {
        this.templates[this.selfManaged] = {
            'options': [
                {
                    'name': 'authSource',
                    'type': 'text'
                }
            ],
            'template': 'mongodb://$[username]:$[password]@$[hostlist]/$[database]?$[options]',
            'templateShell': 'mongodb://$[username]:$[password]@$[hostlist]/$[database]?$[options]',
            'templatePasswordRedactedShell': 'mongodb://$[hostlist]/$[database]?$[options] --username $[username]',
            'nodeuristring': '\'mongodb://%s:%s@$[hostlist]/$[database]?$[options]\''
        };
        this.templates[this.replicaSet] = {
            'options': [
                {
                    'name': 'replicaSet',
                    'type': 'text'
                },
                {
                    'name': 'authSource',
                    'type': 'text'
                },
                {
                    'name': 'ssl',
                    'type': 'pass-through',
                    'value': 'true'
                }
            ],
            'template': 'mongodb://$[username]:$[password]@$[hostlist]/$[database]?$[options]',
            'templateShell': 'mongodb://$[username]:$[password]@$[hostlist]/$[database]?$[options]',
            'templatePasswordRedactedShell': 'mongodb://$[hostlist]/$[database]?$[options] --username $[username] --password',
            'nodeuristring': '\'mongodb://%s:%s@$[hostlist]/$[database]?$[options]\''
        };
        this.templates[this.atlas3dot6] = {
            'options': [],
            'template': 'mongodb+srv://$[username]:$[password]@$[hostlist]/$[database]',
            'templateShell': 'mongodb+srv://$[username]:$[password]@$[hostlist]/$[database]',
            'templatePasswordRedactedShell': 'mongodb+srv://$[hostlist]/$[database] --username $[username] --password',
            'nodeuristring': '\'mongodb+srv://%s:%s@$[hostlist]/$[database]\''
        };
        this.templates[this.atlas3dot4] = {
            'options': [
                {
                    'name': 'replicaSet',
                    'type': 'text'
                },
                {
                    'name': 'authSource',
                    'type': '[text]'
                },
                {
                    'name': 'ssl',
                    'type': 'pass-through',
                    'value': 'true'
                }
            ],
            'template': 'mongodb://$[username]:$[password]@$[hostlist]/$[database]?$[options]',
            'templateShell': 'mongodb://$[hostlist]/$[database]?replicaSet=$[replicaSet] --ssl true --authenticationDatabase $[authSource]  --username $[username] --password $[password]',
            'templatePasswordRedactedShell': 'mongodb://$[hostlist]/$[database]?replicaSet=$[replicaSet] --ssl true --authenticationDatabase $[authSource]  --username $[username] --password',
            'nodeuristring': '\'mongodb://%s:%s@$[hostlist]/$[database]?$[options]\''
        };
    }

    // get stuff related to this component out of local storage
    get uriwriter() {
        return JSON.parse(window.localStorage.getItem(this.key)) || {};
    }

    // put stuff related to this coponent in local storage, we only set the whole thing, not portions
    set uriwriter(value) {
        const uriwriter = value;
        window.localStorage.setItem(this.key, JSON.stringify(uriwriter));
    }

    // add or modify a value in our uriwriter in local storage.
    addValue(key, value) {
        const uriwriter = this.uriwriter;
        uriwriter[key] = value;
        this.uriwriter = uriwriter;
    }

    preparseUristrings() {
        const listPre = document.getElementsByTagName('pre');
        for (let i = 0; i < listPre.length; i += 1) {
            if (listPre[i].innerHTML.indexOf('&lt;URISTRING&gt;') > -1) {
                listPre[i].innerHTML = listPre[i].innerHTML.replace('&lt;URISTRING&gt;', '<span>&lt;URISTRING&gt;</span>');
            }
            if (listPre[i].innerHTML.indexOf('&lt;USERNAME&gt;') > -1) {
                listPre[i].innerHTML = listPre[i].innerHTML.replace('&lt;URISTRING&gt;', '<span>&lt;USERNAME&gt;</span>');
            }
            if (listPre[i].innerHTML.indexOf('&lt;URISTRING_NOUSER&gt;') > -1) {
                listPre[i].innerHTML = listPre[i].innerHTML.replace('&lt;URISTRING_NOUSER&gt;', '<span>&lt;URISTRING_NOUSER&gt;</span>');
            }
            if (listPre[i].innerHTML.indexOf('&lt;NODE_URISTRING&gt;') > -1) {
                listPre[i].innerHTML = listPre[i].innerHTML.replace('&lt;NODE_URISTRING&gt;', '<span>&lt;NODE_URISTRING&gt;</span>');
            }
            if (listPre[i].innerHTML.indexOf('&lt;URISTRING_SHELL&gt;') > -1) {
                listPre[i].innerHTML = listPre[i].innerHTML.replace('&lt;URISTRING_SHELL&gt;', '<span>&lt;URISTRING_SHELL&gt;</span>');
            }
        }
    }

    // setup view hooks to change when data or environment changes
    setupURIListeners() {
        console.log('Set up URI listeners');
        this.preparseUristrings();
        const list = document.getElementsByTagName('span');
        for (let i = 0; i < list.length; i += 1) {
            if (list[i].innerHTML.indexOf('&lt;URISTRING&gt;') > -1) {
                this.uristowrite.push(list[i]);
            }
            if (list[i].innerHTML.indexOf('&lt;USERNAME&gt;') > -1) {
                this.usernamestowrite.push(list[i]);
            }
            if (list[i].innerHTML.indexOf('&lt;URISTRING_SHELL&gt;') > -1) {
                this.uristowriteshell.push(list[i]);
            }
            if (list[i].innerHTML.indexOf('&lt;URISTRING_NOUSER&gt;') > -1) {
                console.log('regeistering password redacted uri');
                this.uristowritepasswordredactedshell.push(list[i]);
            //    this.replaceKeyNoUserShell = '&lt;URISTRING_SHELL_NOUSER&gt;';
            }
            if (list[i].innerHTML.indexOf('&lt;NODE_URISTRING&gt;') > -1) {
                this.uristowritenode.push(list[i]);
            }
        }
    }

    getPrefix(uri) {
        if ((uri.charAt(0) === '\'') ||
            (uri.charAt(0) === '"')) {
            return uri.charAt(0);
        }
        return '';
    }

    writeToPlaceholders() {
        console.log('writing to placeholders');
        for (let i = 0; i < this.uristowrite.length; i += 1) {
            let prefix = this.getPrefix(this.uristowrite[i].innerHTML);
            this.uristowrite[i].innerHTML = `${prefix}${this.urireplacestring}${prefix}`;
        }
        for (let i = 0; i < this.uristowritepasswordredactedshell.length; i += 1) {
            this.uristowritepasswordredactedshell[i].innerHTML = this.urireplacestringPasswordRedactedShell;
        }
        for (let i = 0; i < this.uristowriteshell.length; i += 1) {
            this.uristowriteshell[i].innerHTML = this.urireplacestringShell;
        }
        for (let i = 0; i < this.uristowritenode.length; i += 1) {
            this.uristowritenode[i].innerHTML = this.nodeuristring;
        }
        // node use case for separation of username out of uri for encoding
        for (let i = 0; i < this.usernamestowrite.length; i += 1) {
            this.usernamestowrite[i].innerHTML = `'${this.username}'`;
        }
    }

    // this is the listener that is triggered when an environment select happens
    setupEnvironmentListeners() {
        const list = document.getElementsByClassName('uriwriter__form__toggle__item');
        for (let i = 0; i < list.length; i += 1) {
            list[i].addEventListener('click', (event) => {
                const e = event.srcElement.innerHTML;
                console.log(e);
                if (e.indexOf('Atlas') > -1) {
                    console.log('found atlas');
                    if (this.uriwriter.atlaspasteduri !== undefined) {
                        console.log('found atlaspasteduri');
                        // move all of this to an encapsulating function;
                        this.parseIncomingAtlasString(this.uriwriter.atlaspasteduri);
                        this.conveyValidAtlasUri();
                        this.hideAtlasInputForm();
                        this.setAtlasInputFieldToWait();
                        this.renderURI();
                        this.populateForm();
                        return;
                    }
                }
                console.log('adding to environemnt');
                this.addValue('env', e);
                console.log('render uri');
                this.renderURI();
                console.log('populate form');
                this.populateForm();
            });
        }
    }


    // return the uri template related to the environment the user is working in
    selectTemplate() {
        return this.templates[this.uriwriter.env];
    }

    // controller for writing the uri out to the listening html
    renderURI() {
        // User is in Atlas placeholder mode, no template defined. Can't render a uri.
        // or should we default?
        if (this.uriwriter.env === 'Atlas (Cloud)') {
            this.addValue('env', this.atlas3dot6);
        }
        // we have a basic idea of the environment, get the associated uri template
        const template = this.selectTemplate();
        // the placeholder uri string template
        this.uristring = template.template;
        // the placeholder uri string without password field
        this.uristringPasswordRedactedShell = template.templatePasswordRedactedShell;
        // options are environment specific settings that need to go in the uri
        this.options = template.options;
        // no we do our replacing of template fields
        this.urireplacestring = this.replaceString(this.uristring);
        // on the redacted one as well
        this.urireplacestringShell = this.replaceString(template.templateShell);
        this.urireplacestringPasswordRedactedShell = this.replaceString(template.templatePasswordRedactedShell);
        this.nodeuristring = this.replaceString(template.nodeuristring);
        this.username = this.uriwriter.username;
        this.writeToPlaceholders();
    }

    optionStringifier(options, type) {
        let optionsTemplate = '';
        let optionsString = '';
        if (this.options.length > 0) {
            const name = this.options[0].name;
            const value = this.getValue(this.uriwriter[name], this.options[0]);
            optionsTemplate = `${name}=${value}`;
            optionsString = optionsTemplate;
        }

        for (let i = 1; i < this.options.length; i += 1) {
            const name = this.options[i].name;
            const value = this.getValue(this.uriwriter[name], this.options[i]);
            optionsString = `${optionsString},${name}=${value}`;
        }

        return optionsString;

    }

    replaceString(localUriString) {

        let repl = localUriString;

        // replace hardcoded plaments (why oh why do we do this????)
        if (this.uriwriter.username) {
            repl = repl.replace('$[username]', this.uriwriter.username);
        }
        if (this.uriwriter.database) {
            repl = repl.replace('$[database]', this.uriwriter.database);
        }
        if (this.uriwriter.authSource) {
            repl = repl.replace('$[authSource]', this.uriwriter.authSource);
        }
        if (this.uriwriter.replicaSet) {
            repl = repl.replace('$[replicaSet]', this.uriwriter.authSource);
        }

        // replace options where they exist
        const optionsString = this.optionStringifier(this.options);

        if (optionsString.length > 0) {
            repl = repl.replace('$[options]', optionsString);
        }

        let hostport = '';

        // get our hosts and ports in
        if (this.uriwriter.hostlist && this.uriwriter.hostlist.length > 0) {
            hostport = `${this.uriwriter.hostlist[0]}`;
            for (let i = 1; i < this.uriwriter.hostlist.length; i += 1) {
                hostport += `,${this.uriwriter.hostlist[i]}`;
            }
            repl = repl.replace('$[hostlist]', hostport);
        }

        return repl;
    }

    getValue(value, option) {
        if (option.type === 'pass-through') {
            return option.value;
        }
        return value;
    }

    clearOptions() {
        const optionsNode = document.getElementById('options');
        while (optionsNode.firstChild) {
            optionsNode.removeChild(optionsNode.firstChild);
        }
    }

    renderOptions() {
        this.clearOptions();
        if (this.options && this.options.length > 0) {
            for (let i = 0; i < this.options.length; i += 1) {
                if (this.options[i].type !== 'pass-through') {
                    this.renderOption(this.options[i]);
                    console.log(this.options[i]);
                }
            }
        }
    }

    renderOption(option) {
        const optionElement = document.createElement('fieldset');
        const inputElement = document.createElement('input');
        inputElement.setAttribute('id', option.name);
        inputElement.setAttribute('type', option.type);
        inputElement.className = 'input-uriwriter';
        if (this.uriwriter[option.name] !== undefined) {
            inputElement.value = this.uriwriter[option.name];
        }
        inputElement.addEventListener('keyup', (event) => {
            this.addValue(option.name, document.getElementById(option.name).value);
            this.renderURI();
        });
        const label = document.createElement('label');
        optionElement.appendChild(inputElement);
        label.setAttribute('for', option.name);
        label.className = 'label-uriwriter';
        label.innerHTML = option.name;
        optionElement.appendChild(label);
        document.getElementById('options').appendChild(optionElement);
    }

    setup() {
        if (document.getElementById('uriwriter') === null) {
            return;
        }
        document.getElementById('uriwriter_act').addEventListener('click', (event) => {
            this.addHostEntryToList();
            this.renderURI();
            event.preventDefault();
        });

        document.getElementById('uriwriter_username').addEventListener('keyup', (event) => {
            this.addValue('username', document.getElementById('uriwriter_username').value);
            this.renderURI();
        });

        document.getElementById('uriwriter_atlaspaste').addEventListener('keyup', (event) => {
            let pastedValue = document.getElementById('uriwriter_atlaspaste').value;
            console.log('keyup atlaspaste');
            if (this.parseIncomingAtlasString(pastedValue) !== true) {
                this.conveyInvalidParse();
                this.resetAtlasInput();
            } else {
                console.log('atlas string successfullly pasted, running render');
                this.addValue('atlaspasteduri', pastedValue);
                this.renderURI();
                this.populateForm();
                this.hideAtlasInputForm();
                this.setAtlasInputFieldToWait();
                this.conveyValidAtlasUri();
                document.getElementById('uriwriter_atlaspaste').value = '';
            }
        });

        const list = document.getElementsByClassName('uriwriter__form__atlascontrols--button');
        for (let i = 0; i < list.length; i += 1) {
            list[i].addEventListener('click', (event) => {
                const e = event.srcElement.id;
                if (e === 'close') {
                    this.clearClusterInfo();
                    this.renderURI();
                    this.populateForm();
                }
            });
        }

        document.getElementById('uriwriter_db').addEventListener('keyup', (event) => {
            this.addValue('database', document.getElementById('uriwriter_db').value);
            this.renderURI();
        });

        this.setupEnvironmentListeners();
        this.populateForm();
    }

    resetAtlasInput() {
        document.getElementsByClassName('uriwriter__form__atlascontrols--wrapper')[0].style.display = '';
        document.getElementsByClassName('uriwriter__form__atlascontrols--button')[0].style.display = 'none';
        document.getElementsByClassName('uriwriter__form__atlascontrols--button')[1].style.display = 'none';
    }

    conveyInvalidParse() {
        document.getElementsByClassName('uriwriter__form__atlascontrols--statusmessage')[0].style.display = '';
        document.getElementsByClassName('uriwriter__form__atlascontrols--statusmessage')[0].style.color = 'red';
        document.getElementsByClassName('uriwriter__form__atlascontrols--statusmessage')[0].innerHTML = 'Atlas string could not be parsed.';
        // do something? email?
    }

    conveyValidParse() {
        document.getElementsByClassName('uriwriter__form__atlascontrols--statusmessage')[0].style.display = '';
        document.getElementsByClassName('uriwriter__form__atlascontrols--statusmessage')[0].style.color = 'green';
        document.getElementsByClassName('uriwriter__form__atlascontrols--statusmessage')[0].innerHTML = 'Atlas string parsed successfully.';
        document.getElementsByClassName('uriwriter__form__atlascontrols--statusmessage')[0].innerHTML = `${this.uriwriter.atlaspasteduri}`;
    }

    conveyValidAtlasUri() {
        this.conveyValidParse();
        document.getElementsByClassName('uriwriter__form__atlascontrols--statusmessage')[0].innerHTML = `Current Uri String: ${this.uriwriter.atlaspasteduri}`;
    }
    renderFormValues() {
        if (this.uriwriter.env === this.selfManaged ||
            this.uriwriter.env === this.replicaSet)
        {
            document.getElementsByClassName('uriwriter__form__atlascontrols')[0].style.display = 'none';
            document.getElementById('userinfo_form').style.display = '';
            // document.getElementsByClassName('uriwriter_atlaspaste_controls')[0].style.display = 'none';
            // document.getElementsByClassName('uriwriter_atlaspaste_statusmessage')[0].style.display = 'none';
        } else {
            document.getElementsByClassName('uriwriter__form__atlascontrols--wrapper')[0].style.display = '';
            if (this.uriwriter.atlaspasteduri !== undefined) {
                document.getElementsByClassName('uriwriter__form__atlascontrols')[0].style.display = '';
                document.getElementsByClassName('uriwriter__form__atlascontrols--wrapper')[0].style.display = 'none';
            } else {
                document.getElementsByClassName('uriwriter__form__atlascontrols')[0].style.display = 'none';
            }
            document.getElementById('userinfo_form').style.display = 'none';
            document.getElementsByClassName('uriwriter__form__atlascontrols')[0].style.display = '';
            return;
        }
        if (this.uriwriter.username !== undefined) {
            document.getElementById('uriwriter_username').value = this.uriwriter.username;
        }
        if (this.uriwriter.database !== undefined) {
            document.getElementById('uriwriter_db').value = this.uriwriter.database;
        }
    }

    hideAtlasInputForm() {
        document.getElementsByClassName('uriwriter__form__atlascontrols--wrapper')[0].style.display = 'none';
    }

    setAtlasInputFieldToWait() {
        document.getElementsByClassName('uriwriter__form__atlascontrols--statusmessage')[0].style.display = '';
        document.getElementsByClassName('uriwriter__form__atlascontrols--detailsmessage')[0].innerHTML = this.uriwriter.atlasgenerateduri;
        document.getElementsByClassName('uriwriter__form__atlascontrols--button')[0].style.display = '';
    }

    clearClusterInfo() {
        this.uriwriter = {};
        this.addValue('env', this.atlas3dot6);
        document.getElementsByClassName('uriwriter__form__atlascontrols--button')[0].style.display = 'none';
        document.getElementsByClassName('uriwriter__form__atlascontrols--statusmessage')[0].style.display = 'none';
        document.getElementsByClassName('uriwriter__form__atlascontrols--detailsmessage')[0].style.display = 'none';
    }

    /** IP related functions **/

    clearIps() {
        const ipNodes = document.getElementById('hostlist');
        while (ipNodes.firstChild) {
            ipNodes.removeChild(ipNodes.firstChild);
        }
    }

    renderIps() {
        this.clearIps();
        const hostlist = this.uriwriter.hostlist;
        if (hostlist === undefined) {
            return;
        }
        for (let i = 0; i < hostlist.length; i += 1) {
            this.renderList(hostlist[i]);
        }
    }

    resetIps() {
        document.getElementById('hostname').value = '';
        document.getElementById('port').value = '';
    }


    addHostEntryToList() {

        const hostname = document.getElementById('hostname').value;
        const port = document.getElementById('port').value;

        if (hostname === '' ||
            (port === '' && this.uriwriter.env !== this.atlas3dot6)) { return; }

        this.resetIps();
        this.persistList(hostname, port);
    }

    persistList(host, port) {
        let template = `${host}:${port}`;
        if (port === '') {
            template = `${host}`;
        }

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

    populateForm() {
        this.resetIps();
        console.log('rendering options');
        this.renderOptions();
        this.renderIps();
        this.renderFormValues();
    }


    /** Atlas copy paste parse and processing **/

    // this is a 3.4 URI
    // mongodb://<USERNAME>:<PASSWORD>@cluster0-shard-00-00-juau5.mongodb.net:27017,cluster0-shard-00-01-juau5.mongodb.net:27017,cluster0-shard-00-02-juau5.mongodb.net:27017/test?ssl=true&replicaSet=Cluster0-shard-0&authSource=admin
    parseTo3dot4(atlasString, tempWriter) {
        tempWriter.env = this.atlas3dot4;
        // save the environment selection
        this.uriwriter = tempWriter;
        tempWriter = this.uriwriter;
        const re = /(\S+):\/\/(\S+):(\S+)@(\S+)\/(\S+)\?(\S+)/;
        const matchesArray = atlasString.match(re);
        if (matchesArray === null) {
            return false;
        }
        if (matchesArray.length === 7) {
            tempWriter.username = matchesArray[2];
            tempWriter.hostlist = matchesArray[4].split(',');
            tempWriter.database = matchesArray[5];
            this.optionsSplitter(tempWriter, matchesArray[6]);
            this.uriwriter = tempWriter;
            return true;
        }
        return false;
    }

    parseOutShellParams(splitOnSpace, tempWriter) {
        // go through all of the command line args, parse
        for (let i = 0; i < splitOnSpace.length; i += 1) {
            if (splitOnSpace[i].startsWith('--')) {
                // this is a key, if next val does not begin with --, its a value
                if (!splitOnSpace[i + 1].startsWith('--')) {
                    let splitKey = splitOnSpace[i].replace('--', '');
                    let splitValue = splitOnSpace[i + 1];
                    // sometimes the next string is another parameter, ignore those as they are canned
                    if (!splitValue.startsWith('--')) {
                        // get rid of brackets which can cause problems with our inline code
                        splitValue = splitValue.replace('<', '').replace('>', '');
                        tempWriter[splitKey] = splitValue;
                    }
                }
            }
        }
        // persist what we have so far
        this.uriwriter = tempWriter;
    }

    parseOutURIParams(shellString, tempWriter) {
        let uriParamArray = shellString.split('&');
        for (let i = 0; i < uriParamArray.length; i += 1) {
            const keyValueString = uriParamArray[i];
            let keyValueArray = keyValueString.split('=');
            tempWriter[keyValueArray[0]] = keyValueArray[1];
        }
        // persist what we have so far
        this.uriwriter = tempWriter;
    }

    parseOutEnvAndClusters(splitOnSpaceClusterEnv, tempWriter) {
        // depending on whether this is 3.6 or 3.4 the cluster info looks slightly different
        // 3.4 uses the URI to pass in a replica set name
        let shellMatch = /(\w+):\/\/((\S+)(:)+(\S+))\/(\w+)?\?(\S+)/;
        const shellMatch36 = /((\w+)\+(\w+)):\/\/((\S+))\/(\w+)/;
        if (splitOnSpaceClusterEnv.startsWith('mongodb+srv')) {
            shellMatch = shellMatch36;
        }
        const shellArray = splitOnSpaceClusterEnv.match(shellMatch);
        // add length check here?
        if (shellArray[1] === 'mongodb') {
            tempWriter.env = this.atlas3dot4;
            const hostListString = shellArray[2];
            tempWriter.hostlist = hostListString.split(',');
            this.parseOutURIParams(shellArray[7], tempWriter);
        } else {
            tempWriter.env = this.atlas3dot6;
            tempWriter.hostlist = [shellArray[4]];
        }
        tempWriter.database = shellArray[6];
        this.uriwriter = tempWriter;
    }
    // mongo "mongodb://cluster0-shard-00-00-igkvv.mongodb.net:27017,cluster0-shard-00-01-igkvv.mongodb.net:27017,cluster0-shard-00-02-igkvv.mongodb.net:27017/test?replicaSet=Cluster0-shard-0" --ssl --authenticationDatabase admin --username mongodb-stitch-easy_bake_oven-aluyj --password <PASSWORD>
    // mongo "mongodb+srv://cluster0-igkvv.mongodb.net/test" --username mongodb-stitch-easy_bake_oven-aluyj
    parseShell(atlasString, tempWriter) {
        // split out the mongo and parse the rest
        console.log('parsing shell');
        const splitOnSpace = atlasString.split(' ');
        console.log('split on space');
        console.log(splitOnSpace);
        let splitOnSpaceClusterEnv = splitOnSpace[1];
        // get rid of double quotes
        splitOnSpaceClusterEnv = splitOnSpaceClusterEnv.replace('"', '');
        // get command line args
        this.parseOutShellParams(splitOnSpace, tempWriter);
        console.log('parsed out shell params');
        // get the cluster information
        this.parseOutEnvAndClusters(splitOnSpaceClusterEnv, tempWriter);
        // we need to define success
        console.log('parsed out environment and clusters');
        return true;
    }

    // get the pasted string and parse it out
    parseIncomingAtlasString(pastedValue) {
        if (undefined === pastedValue) {
            return false;
        }
        // trim any carriage return line feed business
        pastedValue = pastedValue.replace(/[\n\r]+/g, '').trim();
        if (pastedValue !== null) {
            return this.parseAtlasString(pastedValue);
        }
        return false;
    }

    // this is a 3.6 url, parse accordingly
    // ex: mongodb+srv://<USERNAME>:<PASSWORD>@cluster0-juau5.mongodb.net/test
    parseTo3dot6(atlasString, tempWriter) {
        tempWriter.env = this.atlas3dot6;
        // save the environment selection
        this.uriwriter = tempWriter;
        tempWriter = this.uriwriter;
        // regexp for 3.6 format
        const re = /(\S+):\/\/(\S+):(\S+)@(\S+)\/(\S+)/;
        const matchesArray = atlasString.match(re);
        if (matchesArray.length === 6) {
            const username = matchesArray[2];
            tempWriter.username = username;
            const clusterhost = matchesArray[4];
            tempWriter.hostlist = [clusterhost];
            const database = matchesArray[5];
            tempWriter.database = database;
            this.uriwriter = tempWriter;
            return true;
        }
        return false;
    }

    parseAtlasString(atlasString) {
        let tempWriter = this.uriwriter;
        // add shell parser here
        if (atlasString.indexOf(' --') > -1) {
            return this.parseShell(atlasString, tempWriter);
        }
        if (atlasString.startsWith('mongodb+srv')) {
            return this.parseTo3dot6(atlasString, tempWriter);
        }
        return this.parseTo3dot4(atlasString, tempWriter);
    }

    optionsSplitter(tempWriter, arrayOfMatches) {
        const settingsArray = arrayOfMatches.split('&');
        if (settingsArray.length > 0) {
            for (let i = 0; i < settingsArray.length; i += 1) {
                console.log(settingsArray[i]);

                const keyValue = settingsArray[i].split('=');
                console.log(keyValue);
                tempWriter[keyValue[0]] = keyValue[1];
            }
        }
    }
}

// Create Uriwriter
export function setup() {
    (new UriwriterSingleton('uriwriter')).setup();
}
