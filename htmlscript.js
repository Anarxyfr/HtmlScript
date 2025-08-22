/**
 * [HtmlScript]{@link https://github.com/anarxyfr/htmlscript}
 *
 * @version 1.0.0
 * @author anarxyfr
 * @copyright anarxyfr 2025
 * @license MIT
 */

class HtmlScript {
    constructor() {
        this.scopes = [new Map()];
        this.functions = new Map();
        this.callStack = [];
        this.init();
    }

    getVariable(name) {
        for (let i = this.scopes.length - 1; i >= 0; i--) {
            if (this.scopes[i].has(name)) {
                return this.scopes[i].get(name);
            }
        }
        return undefined;
    }

    setVariable(name, value, local = true) {
        if (local) {
            this.scopes[this.scopes.length - 1].set(name, value);
        } else {
            this.scopes[0].set(name, value);
        }
    }

    evaluate(expression) {
        try {
            
            return this.safeEvaluate(expression);
        } catch (e) {
            console.error('Evaluation error:', expression, e);
            throw e;
        }
    }

    safeEvaluate(expr) {
        const tokens = this.tokenize(expr);
        const postfix = this.toPostfix(tokens);
        return this.evaluatePostfix(postfix);
    }

    tokenize(expr) {
        const tokens = [];
        let i = 0;
        while (i < expr.length) {
            const ch = expr[i];
            if (/\s/.test(ch)) {
                i++;
                continue;
            }
            if (/[0-9]/.test(ch)) {
                let num = '';
                while (i < expr.length && /[0-9.]/.test(expr[i])) {
                    num += expr[i++];
                }
                tokens.push({ type: 'number', value: parseFloat(num) });
                continue;
            }
            if (/[a-zA-Z_]/.test(ch)) {
                let id = '';
                while (i < expr.length && /[a-zA-Z0-9_]/.test(expr[i])) {
                    id += expr[i++];
                }
                tokens.push({ type: 'identifier', value: id });
                continue;
            }
            if ('+-*/()^'.includes(ch)) {
                tokens.push({ type: 'operator', value: ch });
                i++;
                continue;
            }
            throw new Error(`Invalid token: ${ch}`);
        }
        return tokens;
    }

    toPostfix(tokens) {
        const output = [];
        const operators = [];
        const precedence = { '^': 4, '*': 3, '/': 3, '+': 2, '-': 2 };
        const associativity = { '^': 'right', '*': 'left', '/': 'left', '+': 'left', '-': 'left' };
        tokens.forEach(token => {
            if (token.type === 'number' || token.type === 'identifier') {
                output.push(token);
            } else if (token.type === 'operator') {
                if (token.value === '(') {
                    operators.push(token);
                } else if (token.value === ')') {
                    while (operators.length && operators[operators.length - 1].value !== '(') {
                        output.push(operators.pop());
                    }
                    operators.pop();
                } else {
                    while (operators.length && operators[operators.length - 1].value !== '(' &&
                        (precedence[operators[operators.length - 1].value] > precedence[token.value] ||
                         (precedence[operators[operators.length - 1].value] === precedence[token.value] &&
                          associativity[token.value] === 'left'))) {
                        output.push(operators.pop());
                    }
                    operators.push(token);
                }
            }
        });
        while (operators.length) {
            output.push(operators.pop());
        }
        return output;
    }

    evaluatePostfix(postfix) {
        const stack = [];
        postfix.forEach(token => {
            if (token.type === 'number') {
                stack.push(token.value);
            } else if (token.type === 'identifier') {
                const val = this.getVariable(token.value);
                if (val === undefined) throw new Error(`Undefined variable: ${token.value}`);
                stack.push(val);
            } else if (token.type === 'operator') {
                const b = stack.pop();
                const a = stack.pop();
                switch (token.value) {
                    case '+': stack.push(a + b); break;
                    case '-': stack.push(a - b); break;
                    case '*': stack.push(a * b); break;
                    case '/': stack.push(a / b); break;
                    case '^': stack.push(Math.pow(a, b)); break;
                    default: throw new Error(`Invalid operator: ${token.value}`);
                }
            }
        });
        return stack[0];
    }

    async processNode(node) {
        if (node.nodeType !== 1) return;
        const tag = node.tagName.toLowerCase();
        this.callStack.push(tag);
        if (this.callStack.length > 50) {
            throw new Error('Recursion depth exceeded');
        }
        let handled = true;
        try {
            switch (tag) {
                case 'store':
                    this.processStore(node);
                    break;
                case 'man':
                    this.processMan(node);
                    break;
                case 'calc':
                    this.processCalc(node);
                    break;
                case 'if':
                    await this.processIf(node);
                    break;
                case 'else':
                    handled = false;
                    break;
                case 'for':
                    await this.processFor(node);
                    break;
                case 'while':
                    await this.processWhile(node);
                    break;
                case 'func':
                    this.processFunc(node);
                    break;
                case 'call':
                    await this.processCall(node);
                    break;
                case 'scope':
                    await this.processScope(node);
                    break;
                case 'input':
                    this.processInput(node);
                    break;
                case 'output':
                    this.processOutput(node);
                    break;
                case 'try':
                    await this.processTry(node);
                    break;
                case 'catch':
                    handled = false;
                    break;
                case 'import':
                    await this.processImport(node);
                    break;
                case 'on':
                    this.processOn(node);
                    break;
                case 'debug':
                    this.processDebug(node);
                    break;
                case 'http':
                    await this.processHttp(node);
                    break;
                case 'json':
                    this.processJson(node);
                    break;
                case 'csv':
                    this.processCsv(node);
                    break;
                case 'ini':
                    this.processIni(node);
                    break;
                case 'xml':
                    this.processXml(node);
                    break;
                case 'yml':
                case 'yaml':
                    this.processYml(node);
                    break;
                case 'break':
                    throw new CustomBreakError();
                case 'continue':
                    throw new CustomContinueError();
                default:
                    handled = false;
                    break;
            }
            if (!handled) {
                await this.processChildren(node);
            }
        } catch (e) {
            if (!(e instanceof CustomBreakError) && !(e instanceof CustomContinueError)) {
                console.error('Error processing node:', tag, e, 'Stack:', this.callStack.join(' > '));
            }
            throw e;
        } finally {
            this.callStack.pop();
        }
    }

    async processChildren(node) {
        const children = Array.from(node.childNodes);
        for (const child of children) {
            await this.processNode(child);
        }
    }

    async processAll() {
        await this.processChildren(document.body);
    }

    processStore(node) {
        const name = node.getAttribute('name');
        const value = node.getAttribute('value');
        const type = node.getAttribute('type');
        const local = node.getAttribute('local') !== 'false';
        const val = this.evaluate(value);
        if (type && typeof val !== type) {
            throw new Error(`Type mismatch for ${name}: expected ${type}, got ${typeof val}`);
        }
        this.setVariable(name, val, local);
        node.remove();
    }

    processMan(node) {
        const name = node.getAttribute('name');
        const operation = node.getAttribute('operation');
        const type = node.getAttribute('type');
        let val = this.getVariable(name);
        if (val === undefined) throw new Error(`Variable ${name} not found`);
        let newVal;
        if (operation.startsWith('.')) {
            
            console.warn('Using unsafe eval for object manipulation');
            newVal = new Function('val', `val${operation}; return val;`)(val);
        } else {
            
            newVal = this.safeEvaluate(val + operation);
        }
        if (type && typeof newVal !== type) {
            throw new Error(`Type mismatch after manipulation for ${name}: expected ${type}, got ${typeof newVal}`);
        }
        this.setVariable(name, newVal);
        node.remove();
    }

    processCalc(node) {
        const expression = node.getAttribute('expression');
        const type = node.getAttribute('type');
        const result = this.evaluate(expression);
        if (type && typeof result !== type) {
            throw new Error(`Type mismatch in calc: expected ${type}, got ${typeof result}`);
        }
        node.innerText = result;
    }

    async processIf(node) {
        const condition = node.getAttribute('condition');
        const cond = this.evaluate(condition);
        const elseNode = node.nextElementSibling && node.nextElementSibling.tagName.toLowerCase() === 'else' ? node.nextElementSibling : null;
        if (cond) {
            await this.processChildren(node);
            node.replaceWith(...node.childNodes);
            if (elseNode) elseNode.remove();
        } else {
            node.remove();
            if (elseNode) {
                await this.processChildren(elseNode);
                elseNode.replaceWith(...elseNode.childNodes);
            }
        }
    }

    async processFor(node) {
        const init = node.getAttribute('init');
        const condition = node.getAttribute('condition');
        const increment = node.getAttribute('increment');
        if (init) {
            const initParts = init.split('=');
            if (initParts.length === 2) {
                const name = initParts[0].trim();
                const val = this.evaluate(initParts[1].trim());
                this.setVariable(name, val);
            } else {
                this.evaluate(init);
            }
        }
        const template = node.cloneNode(true);
        node.innerHTML = '';
        while (this.evaluate(condition)) {
            const iteration = template.cloneNode(true);
            try {
                await this.processChildren(iteration);
            } catch (e) {
                if (e instanceof CustomBreakError) {
                    break;
                } else if (e instanceof CustomContinueError) {
                    this.evaluate(increment);
                    continue;
                } else {
                    throw e;
                }
            }
            node.appendChild(iteration);
            this.evaluate(increment);
        }
        node.replaceWith(...node.childNodes);
    }

    async processWhile(node) {
        const condition = node.getAttribute('condition');
        const template = node.cloneNode(true);
        node.innerHTML = '';
        while (this.evaluate(condition)) {
            const iteration = template.cloneNode(true);
            try {
                await this.processChildren(iteration);
            } catch (e) {
                if (e instanceof CustomBreakError) {
                    break;
                } else if (e instanceof CustomContinueError) {
                    continue;
                } else {
                    throw e;
                }
            }
            node.appendChild(iteration);
        }
        node.replaceWith(...node.childNodes);
    }

    processFunc(node) {
        const name = node.getAttribute('name');
        const params = node.getAttribute('params') ? node.getAttribute('params').split(',').map(p => p.trim()) : [];
        const body = node.cloneNode(true);
        const closedScope = new Map([...this.scopes.flatMap(s => [...s.entries()])]); 
        this.functions.set(name, { params, body, closedScope });
        node.remove();
    }

    async processCall(node) {
        const funcName = node.getAttribute('func');
        const argsStr = node.getAttribute('args');
        const varName = node.getAttribute('var');
        const f = this.functions.get(funcName);
        if (!f) throw new Error(`Function ${funcName} not found`);
        const args = argsStr ? this.evaluate(`[${argsStr}]`) : [];
        if (args.length !== f.params.length) throw new Error('Argument count mismatch');
        const prevScopes = this.scopes;
        this.scopes = [new Map(f.closedScope)];
        f.params.forEach((p, i) => this.setVariable(p, args[i]));
        const bodyClone = f.body.cloneNode(true);
        await this.processChildren(bodyClone);
        let retVal = undefined;
        const returnTags = bodyClone.querySelectorAll('return');
        Array.from(returnTags).forEach(returnTag => {
            const expr = returnTag.getAttribute('expression');
            retVal = this.evaluate(expr);
            returnTag.remove();
        });
        if (varName) {
            this.setVariable(varName, retVal);
            node.remove();
        } else {
            node.replaceWith(...bodyClone.childNodes);
        }
        this.scopes = prevScopes;
    }

    async processScope(node) {
        this.scopes.push(new Map());
        await this.processChildren(node);
        node.replaceWith(...node.childNodes);
        this.scopes.pop();
    }

    processInput(node) {
        const varName = node.getAttribute('var');
        const promptText = node.getAttribute('prompt') || '';
        const value = prompt(promptText);
        this.setVariable(varName, value);
        node.remove();
    }

    processOutput(node) {
        const expr = node.getAttribute('expression');
        const value = this.evaluate(expr);
        node.innerText = value.toString();
    }

    async processTry(node) {
        const catchNode = node.nextElementSibling && node.nextElementSibling.tagName.toLowerCase() === 'catch' ? node.nextElementSibling : null;
        const catchVar = catchNode ? catchNode.getAttribute('var') || 'e' : 'e';
        try {
            await this.processChildren(node);
            node.replaceWith(...node.childNodes);
            if (catchNode) catchNode.remove();
        } catch (e) {
            node.remove();
            if (catchNode) {
                this.setVariable(catchVar, e);
                await this.processChildren(catchNode);
                catchNode.replaceWith(...catchNode.childNodes);
            } else {
                throw e;
            }
        }
    }

    async processImport(node) {
        const src = node.getAttribute('src');
        const type = node.getAttribute('type') || 'script';
        const namespace = node.getAttribute('namespace');
        try {
            const response = await fetch(src);
            const text = await response.text();
            if (namespace) {
                this.scopes.push(new Map());
            }
            if (type === 'module') {
                const module = await import(src);
                this.setVariable(namespace || 'imported', module);
            } else if (type === 'script') {
                new Function(text)();
            } else if (type === 'html') {
                const div = document.createElement('div');
                div.innerHTML = text;
                await this.processChildren(div);
                node.replaceWith(...div.childNodes);
            }
            if (namespace) {
                this.scopes.pop();
            }
        } catch (e) {
            console.error(`Import failed from ${src}:`, e);
        }
        node.remove();
    }

    processOn(node) {
        const event = node.getAttribute('event');
        const selector = node.getAttribute('selector');
        const body = node.cloneNode(true);
        node.remove();
        const elems = document.querySelectorAll(selector);
        elems.forEach(elem => {
            elem.addEventListener(event, async (evt) => {
                this.scopes.push(new Map());
                this.setVariable('event', evt);
                const clone = body.cloneNode(true);
                await this.processChildren(clone);
                this.scopes.pop();
            });
        });
    }

    processDebug(node) {
        const varName = node.getAttribute('var');
        if (varName) {
            console.dir(this.getVariable(varName));
        } else {
            console.log('Debug point reached', new Error().stack);
        }
        node.remove();
    }

    async processHttp(node) {
        const method = node.getAttribute('method')?.toUpperCase() || 'GET';
        const url = node.getAttribute('url');
        const headersStr = node.getAttribute('headers');
        const bodyStr = node.getAttribute('body');
        const varName = node.getAttribute('var');
        
        try {
            const headers = headersStr ? this.evaluate(headersStr) : {};
            const body = bodyStr ? JSON.stringify(this.evaluate(bodyStr)) : null;
            const options = {
                method,
                headers,
                body: method !== 'GET' && method !== 'HEAD' ? body : null,
            };

            const response = await fetch(url, options);
            let result;
            if (response.headers.get('content-type')?.includes('application/json')) {
                result = await response.json();
            } else {
                result = await response.text();
            }
            
            if (varName) {
                this.setVariable(varName, result);
                node.remove();
            } else {
                node.innerText = JSON.stringify(result);
            }
        } catch (e) {
            console.error('HTTP request failed:', url, e);
            if (varName) {
                this.setVariable(varName, { error: e.message });
                node.remove();
            } else {
                node.innerText = `Error: ${e.message}`;
            }
        }
    }

    processJson(node) {
        const varName = node.getAttribute('var');
        const action = node.getAttribute('action') || 'parse';
        const source = node.getAttribute('source') || node.innerText.trim();
        try {
            let result;
            if (action === 'parse') {
                result = JSON.parse(source);
            } else if (action === 'stringify') {
                const data = this.evaluate(source);
                result = JSON.stringify(data);
            } else {
                throw new Error('Invalid JSON action');
            }
            if (varName) {
                this.setVariable(varName, result);
                node.remove();
            } else {
                node.innerText = result.toString();
            }
        } catch (e) {
            console.error('JSON processing error:', e);
            if (varName) {
                this.setVariable(varName, { error: e.message });
                node.remove();
            } else {
                node.innerText = `Error: ${e.message}`;
            }
        }
    }

    processCsv(node) {
        const varName = node.getAttribute('var');
        const action = node.getAttribute('action') || 'parse';
        const source = node.getAttribute('source') || node.innerText.trim();
        try {
            let result;
            if (action === 'parse') {
                const rows = source.split('\n').map(row => row.split(',').map(cell => cell.trim()));
                result = rows;
            } else if (action === 'stringify') {
                let data = this.evaluate(source);
                if (!Array.isArray(data)) throw new Error('CSV stringify requires an array');
                if (data.length > 0 && typeof data[0] === 'object') {
                    const keys = Object.keys(data[0]);
                    const csvRows = [keys.join(',')];
                    data.forEach(obj => {
                        csvRows.push(keys.map(key => obj[key] ?? '').join(','));
                    });
                    result = csvRows.join('\n');
                } else {
                    result = data.map(row => row.join(',')).join('\n');
                }
            } else {
                throw new Error('Invalid CSV action');
            }
            if (varName) {
                this.setVariable(varName, result);
                node.remove();
            } else {
                node.innerText = result.toString();
            }
        } catch (e) {
            console.error('CSV processing error:', e);
            if (varName) {
                this.setVariable(varName, { error: e.message });
                node.remove();
            } else {
                node.innerText = `Error: ${e.message}`;
            }
        }
    }

    processIni(node) {
        const varName = node.getAttribute('var');
        const action = node.getAttribute('action') || 'parse';
        const source = node.getAttribute('source') || node.innerText.trim();
        try {
            let result;
            if (action === 'parse') {
                const obj = {};
                let currentSection = null;
                source.split('\n').forEach(line => {
                    line = line.trim();
                    if (!line || line.startsWith(';') || line.startsWith('#')) return;
                    if (line.match(/^\[.*\]$/)) {
                        currentSection = line.slice(1, -1);
                        obj[currentSection] = {};
                    } else if (line.includes('=') && currentSection) {
                        const [key, value] = line.split('=').map(s => s.trim());
                        obj[currentSection][key] = value;
                    }
                });
                result = obj;
            } else if (action === 'stringify') {
                const data = this.evaluate(source);
                const lines = [];
                for (const [section, props] of Object.entries(data)) {
                    lines.push(`[${section}]`);
                    for (const [key, value] of Object.entries(props)) {
                        lines.push(`${key}=${value}`);
                    }
                }
                result = lines.join('\n');
            } else {
                throw new Error('Invalid INI action');
            }
            if (varName) {
                this.setVariable(varName, result);
                node.remove();
            } else {
                node.innerText = result.toString();
            }
        } catch (e) {
            console.error('INI processing error:', e);
            if (varName) {
                this.setVariable(varName, { error: e.message });
                node.remove();
            } else {
                node.innerText = `Error: ${e.message}`;
            }
        }
    }

    processXml(node) {
        const varName = node.getAttribute('var');
        const action = node.getAttribute('action') || 'parse';
        const source = node.getAttribute('source') || node.innerText.trim();
        try {
            let result;
            if (action === 'parse') {
                const parser = new DOMParser();
                const xmlDoc = parser.parseFromString(source, 'application/xml');
                const errorNode = xmlDoc.querySelector('parsererror');
                if (errorNode) throw new Error('Invalid XML');
                result = this.xmlToObject(xmlDoc.documentElement);
            } else if (action === 'stringify') {
                const data = this.evaluate(source);
                result = this.objectToXml(data);
            } else {
                throw new Error('Invalid XML action');
            }
            if (varName) {
                this.setVariable(varName, result);
                node.remove();
            } else {
                node.innerText = result.toString();
            }
        } catch (e) {
            console.error('XML processing error:', e);
            if (varName) {
                this.setVariable(varName, { error: e.message });
                node.remove();
            } else {
                node.innerText = `Error: ${e.message}`;
            }
        }
    }

    xmlToObject(node) {
        const obj = { name: node.tagName };
        if (node.attributes) {
            obj.attributes = {};
            for (const attr of node.attributes) {
                obj.attributes[attr.name] = attr.value;
            }
        }
        if (node.childNodes.length === 1 && node.childNodes[0].nodeType === 3) {
            obj.text = node.childNodes[0].textContent.trim();
        } else {
            obj.children = [];
            for (const child of node.childNodes) {
                if (child.nodeType === 1) {
                    obj.children.push(this.xmlToObject(child));
                }
            }
        }
        return obj;
    }

    objectToXml(obj, tagName = 'root') {
        tagName = obj.name || tagName;
        let xml = `<${tagName}`;
        if (obj.attributes) {
            for (const [key, value] of Object.entries(obj.attributes)) {
                xml += ` ${key}="${value}"`;
            }
        }
        xml += '>';
        if (obj.text) {
            xml += obj.text;
        } else if (obj.children) {
            for (const child of obj.children) {
                xml += this.objectToXml(child);
            }
        }
        xml += `</${tagName}>`;
        return xml;
    }

    processYml(node) {
        const varName = node.getAttribute('var');
        const action = node.getAttribute('action') || 'parse';
        const source = node.getAttribute('source') || node.innerText.trim();
        try {
            let result;
            if (action === 'parse') {
                result = this.parseYml(source);
            } else if (action === 'stringify') {
                const data = this.evaluate(source);
                result = this.stringifyYml(data);
            } else {
                throw new Error('Invalid YML action');
            }
            if (varName) {
                this.setVariable(varName, result);
                node.remove();
            } else {
                node.innerText = result.toString();
            }
        } catch (e) {
            console.error('YML processing error:', e);
            if (varName) {
                this.setVariable(varName, { error: e.message });
                node.remove();
            } else {
                node.innerText = `Error: ${e.message}`;
            }
        }
    }

    parseYml(source) {
        const lines = source.split('\n');
        const stack = [];
        let root = {};
        let current = root;
        let lastIndent = 0;
        lines.forEach((line, index) => {
            if (line.trim() === '' || line.trim().startsWith('#')) return;
            const indent = line.match(/^\s*/) [0].length;
            const trimmed = line.trim();
            if (indent < lastIndent) {
                for (let j = 0; j < (lastIndent - indent) / 2; j++) {
                    stack.pop();
                }
                current = stack[stack.length - 1] || root;
            } else if (indent > lastIndent) {
                if (indent - lastIndent !== 2) throw new Error('Invalid indentation at line ' + (index + 1));
            }
            lastIndent = indent;
            if (trimmed.startsWith('-')) {
                const valueStr = trimmed.slice(1).trim();
                if (Array.isArray(current)) {
                    const lastItem = current[current.length - 1];
                    if (valueStr.includes(':')) {
                        const [key, value] = valueStr.split(':').map(s => s.trim());
                        lastItem[key] = this.parseYmlValue(value);
                    } else {
                        current.push(this.parseYmlValue(valueStr));
                    }
                } else {
                    const newArray = [];
                    current = newArray;
                    stack[stack.length - 1][Object.keys(stack[stack.length - 1])[Object.keys(stack[stack.length - 1]).length - 1]] = newArray;
                    stack.push(newArray);
                    newArray.push(this.parseYmlValue(valueStr));
                }
            } else if (trimmed.includes(':')) {
                const [key, valueStr] = trimmed.split(':').map(s => s.trim());
                const value = this.parseYmlValue(valueStr);
                if (value === undefined) {
                    const newObj = {};
                    current[key] = newObj;
                    stack.push(current);
                    current = newObj;
                } else {
                    current[key] = value;
                }
            } else {
                throw new Error('Invalid YAML syntax at line ' + (index + 1));
            }
        });
        return root;
    }

    parseYmlValue(valueStr) {
        if (valueStr === '') return undefined;
        if (!isNaN(valueStr)) return Number(valueStr);
        if (valueStr === 'true') return true;
        if (valueStr === 'false') return false;
        if (valueStr.startsWith('"') && valueStr.endsWith('"')) return valueStr.slice(1, -1);
        return valueStr;
    }

    stringifyYml(obj, indent = 0) {
        let result = '';
        const space = ' '.repeat(indent);
        for (const [key, value] of Object.entries(obj)) {
            if (Array.isArray(value)) {
                result += `${space}${key}:\n`;
                value.forEach(item => {
                    if (typeof item === 'object') {
                        result += `${space}  - \n${this.stringifyYml(item, indent + 4)}`;
                    } else {
                        result += `${space}  - ${item}\n`;
                    }
                });
            } else if (typeof value === 'object' && value !== null) {
                result += `${space}${key}:\n${this.stringifyYml(value, indent + 2)}`;
            } else {
                result += `${space}${key}: ${value}\n`;
            }
        }
        return result;
    }

    init() {
        document.addEventListener('DOMContentLoaded', async () => {
            await this.processAll();
        });
    }
}

class CustomBreakError extends Error {
    constructor() {
        super('break');
    }
}

class CustomContinueError extends Error {
    constructor() {
        super('continue');
    }
}

const htmlScript = new HtmlScript();




