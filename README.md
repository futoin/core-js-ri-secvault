
  [![NPM Version](https://img.shields.io/npm/v/futoin-secvault.svg?style=flat)](https://www.npmjs.com/package/futoin-secvault)
  [![NPM Downloads](https://img.shields.io/npm/dm/futoin-secvault.svg?style=flat)](https://www.npmjs.com/package/futoin-secvault)
  [![Build Status](https://travis-ci.org/futoin/core-js-ri-secvault.svg)](https://travis-ci.org/futoin/core-js-ri-secvault)
  [![stable](https://img.shields.io/badge/stability-stable-green.svg?style=flat)](https://www.npmjs.com/package/futoin-secvault)

  [![NPM](https://nodei.co/npm/futoin-secvault.png?downloads=true&downloadRank=true&stars=true)](https://nodei.co/npm/futoin-secvault/)

# FutoIn reference implementation

Reference implementation of:
 
* [FTN13: FutoIn Secure Vault](http://specs.futoin.org/draft/preview/ftn13_secure_vault.html)

Author: [Andrey Galkin](mailto:andrey@futoin.org)

[Web Site](http://futoin.org/)

# About


# Installation for Node.js

Command line:
```sh
$ npm install futoin-secvault --save
```
or:

```sh
$ yarn add futoin-secvault --save
```

# Examples

```javascript
```
    
# API documentation

## Classes

<dl>
<dt><a href="#BaseFace">BaseFace</a></dt>
<dd><p>Base Face with neutral common registration functionality</p>
</dd>
<dt><a href="#BaseService">BaseService</a></dt>
<dd><p>Base Service with common registration logic</p>
</dd>
</dl>

<a name="BaseFace"></a>

## BaseFace
Base Face with neutral common registration functionality

**Kind**: global class  
**Note**: Not official API  

* [BaseFace](#BaseFace)
    * [.LATEST_VERSION](#BaseFace.LATEST_VERSION)
    * [.PING_VERSION](#BaseFace.PING_VERSION)
    * [.register(as, ccm, name, endpoint, [credentials], [options])](#BaseFace.register)

<a name="BaseFace.LATEST_VERSION"></a>

### BaseFace.LATEST_VERSION
Latest supported FTN13 version

**Kind**: static property of [<code>BaseFace</code>](#BaseFace)  
<a name="BaseFace.PING_VERSION"></a>

### BaseFace.PING_VERSION
Latest supported FTN4 version

**Kind**: static property of [<code>BaseFace</code>](#BaseFace)  
<a name="BaseFace.register"></a>

### BaseFace.register(as, ccm, name, endpoint, [credentials], [options])
CCM registration helper

**Kind**: static method of [<code>BaseFace</code>](#BaseFace)  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| as | <code>AsyncSteps</code> |  | steps interface |
| ccm | <code>AdvancedCCM</code> |  | CCM instance |
| name | <code>string</code> |  | CCM registration name |
| endpoint | <code>\*</code> |  | see AdvancedCCM#register |
| [credentials] | <code>\*</code> | <code></code> | see AdvancedCCM#register |
| [options] | <code>object</code> | <code>{}</code> | interface options |
| [options.version] | <code>string</code> | <code>&quot;1.0&quot;</code> | interface version to use |

<a name="BaseService"></a>

## BaseService
Base Service with common registration logic

**Kind**: global class  

* [BaseService](#BaseService)
    * _instance_
        * [._checkType(type, val)](#BaseService+_checkType) ⇒ <code>boolean</code>
    * _static_
        * [.register(as, executor, options)](#BaseService.register) ⇒ <code>LimitsService</code>

<a name="BaseService+_checkType"></a>

### baseService._checkType(type, val) ⇒ <code>boolean</code>
Check value against type in spec of implemented interface

**Kind**: instance method of [<code>BaseService</code>](#BaseService)  
**Returns**: <code>boolean</code> - result of check  

| Param | Type | Description |
| --- | --- | --- |
| type | <code>string</code> | name of defined type |
| val | <code>\*</code> | value to check |

<a name="BaseService.register"></a>

### BaseService.register(as, executor, options) ⇒ <code>LimitsService</code>
Register futoin.xfers.limits interface with Executor

**Kind**: static method of [<code>BaseService</code>](#BaseService)  
**Returns**: <code>LimitsService</code> - instance  

| Param | Type | Description |
| --- | --- | --- |
| as | <code>AsyncSteps</code> | steps interface |
| executor | <code>Executor</code> | executor instance |
| options | <code>object</code> | implementation defined options |


