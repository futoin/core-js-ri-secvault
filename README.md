
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
<dt><a href="#DataFace">DataFace</a></dt>
<dd><p>Data Face</p>
</dd>
<dt><a href="#DataService">DataService</a></dt>
<dd><p>Data Service</p>
</dd>
<dt><a href="#KeyFace">KeyFace</a></dt>
<dd><p>Keys Face</p>
</dd>
<dt><a href="#KeyService">KeyService</a></dt>
<dd><p>Key Service</p>
</dd>
<dt><a href="#BaseFace">BaseFace</a></dt>
<dd><p>Base Face with neutral common registration functionality</p>
</dd>
<dt><a href="#BaseService">BaseService</a></dt>
<dd><p>Base Service with common registration logic</p>
</dd>
<dt><a href="#AESPlugin">AESPlugin</a></dt>
<dd><p>AES plugin</p>
</dd>
<dt><a href="#HKDFPlugin">HKDFPlugin</a></dt>
<dd><p>HKDF plugin</p>
</dd>
<dt><a href="#PBKDF2Plugin">PBKDF2Plugin</a></dt>
<dd><p>PBKDF2 plugin</p>
</dd>
<dt><a href="#RSAPlugin">RSAPlugin</a></dt>
<dd><p>RSA plugin</p>
</dd>
<dt><a href="#VaultPlugin">VaultPlugin</a></dt>
<dd><p>Base for SecVault plugins</p>
</dd>
<dt><a href="#DBStorage">DBStorage</a></dt>
<dd><p>Database Encrypted secret storage</p>
</dd>
<dt><a href="#EncryptedStorage">EncryptedStorage</a></dt>
<dd><p>Encrypted secret storage base</p>
<p>Assume there is</p>
</dd>
<dt><a href="#KeyInfo">KeyInfo</a></dt>
<dd><p>Sealed key info</p>
</dd>
<dt><a href="#Storage">Storage</a></dt>
<dd><p>Secret storage base</p>
</dd>
</dl>

<a name="DataFace"></a>

## DataFace
Data Face

**Kind**: global class  
<a name="DataService"></a>

## DataService
Data Service

**Kind**: global class  
<a name="KeyFace"></a>

## KeyFace
Keys Face

**Kind**: global class  
<a name="KeyService"></a>

## KeyService
Key Service

**Kind**: global class  
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

<a name="AESPlugin"></a>

## AESPlugin
AES plugin

**Kind**: global class  
<a name="AESPlugin.register"></a>

### AESPlugin.register()
Register this plugin

**Kind**: static method of [<code>AESPlugin</code>](#AESPlugin)  
<a name="HKDFPlugin"></a>

## HKDFPlugin
HKDF plugin

**Kind**: global class  
<a name="HKDFPlugin.register"></a>

### HKDFPlugin.register()
Register this plugin

**Kind**: static method of [<code>HKDFPlugin</code>](#HKDFPlugin)  
<a name="PBKDF2Plugin"></a>

## PBKDF2Plugin
PBKDF2 plugin

**Kind**: global class  
<a name="PBKDF2Plugin.register"></a>

### PBKDF2Plugin.register()
Register this plugin

**Kind**: static method of [<code>PBKDF2Plugin</code>](#PBKDF2Plugin)  
<a name="RSAPlugin"></a>

## RSAPlugin
RSA plugin

**Kind**: global class  
<a name="RSAPlugin.register"></a>

### RSAPlugin.register()
Register this plugin

**Kind**: static method of [<code>RSAPlugin</code>](#RSAPlugin)  
<a name="VaultPlugin"></a>

## VaultPlugin
Base for SecVault plugins

**Kind**: global class  

* [VaultPlugin](#VaultPlugin)
    * _instance_
        * [.generate(as, options)](#VaultPlugin+generate)
        * [.derive(as, base, bits, digest, options)](#VaultPlugin+derive)
        * [.pubkey(as, key, options)](#VaultPlugin+pubkey)
        * [.encrypt(as, key, data, options)](#VaultPlugin+encrypt)
        * [.decrypt(as, key, edata, options)](#VaultPlugin+decrypt)
        * [.random(as, size)](#VaultPlugin+random)
    * _static_
        * [.registerPlugin(name, impl)](#VaultPlugin.registerPlugin)
        * [.getPlugin(name)](#VaultPlugin.getPlugin) ⇒ [<code>VaultPlugin</code>](#VaultPlugin)

<a name="VaultPlugin+generate"></a>

### vaultPlugin.generate(as, options)
Generate new key

**Kind**: instance method of [<code>VaultPlugin</code>](#VaultPlugin)  
**Note**: passes raw key buffer to the next step  

| Param | Type | Description |
| --- | --- | --- |
| as | <code>AsyncSteps</code> | AsyncSteps interface |
| options | <code>object</code> | implementation-defined options |
| options.bits | <code>integer</code> | key length, if applicable |

<a name="VaultPlugin+derive"></a>

### vaultPlugin.derive(as, base, bits, digest, options)
Derive new key

**Kind**: instance method of [<code>VaultPlugin</code>](#VaultPlugin)  
**Note**: passes raw key buffer to the next step  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| as | <code>AsyncSteps</code> |  | AsyncSteps interface |
| base | <code>Buffer</code> |  | base key as is |
| bits | <code>integer</code> |  | key length |
| digest | <code>string</code> |  | digest name to use |
| options | <code>object</code> |  | implementation-defined options |
| options.salt | <code>string</code> | <code>&quot;&#x27;&#x27;&quot;</code> | salt, if any |
| options.info | <code>string</code> | <code>&quot;&#x27;&#x27;&quot;</code> | info, if any |
| options.rounds | <code>integer</code> | <code>1000</code> | rounds, if any |

<a name="VaultPlugin+pubkey"></a>

### vaultPlugin.pubkey(as, key, options)
Get public key from private key

**Kind**: instance method of [<code>VaultPlugin</code>](#VaultPlugin)  
**Note**: passes raw key buffer to the next step  

| Param | Type | Description |
| --- | --- | --- |
| as | <code>AsyncSteps</code> | AsyncSteps interface |
| key | <code>Buffer</code> | raw private key |
| options | <code>object</code> | implementation-defined options |

<a name="VaultPlugin+encrypt"></a>

### vaultPlugin.encrypt(as, key, data, options)
Encrypt arbitrary data

**Kind**: instance method of [<code>VaultPlugin</code>](#VaultPlugin)  
**Note**: Passes Buffer { edata | iv | authtag } to the next step  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| as | <code>AsyncSteps</code> |  | AsyncSteps interface |
| key | <code>Buffer</code> |  | raw key |
| data | <code>Buffer</code> |  | raw data |
| options | <code>object</code> |  | implementation-defined options |
| options.iv | <code>Buffer</code> | <code></code> | custom IV, if needed |
| options.aad | <code>Buffer</code> | <code></code> | additional data, if supported |

<a name="VaultPlugin+decrypt"></a>

### vaultPlugin.decrypt(as, key, edata, options)
Decrypt arbitrary data

**Kind**: instance method of [<code>VaultPlugin</code>](#VaultPlugin)  
**Note**: Passes Buffer of raw data to the next step  

| Param | Type | Description |
| --- | --- | --- |
| as | <code>AsyncSteps</code> | AsyncSteps interface |
| key | <code>Buffer</code> | raw key |
| edata | <code>object</code> | encrypted data as generated by encrypt |
| options | <code>object</code> | implementation-defined options |
| options.aad | <code>string</code> | additional authentication data, if applicable |

<a name="VaultPlugin+random"></a>

### vaultPlugin.random(as, size)
Common API to generate random data

**Kind**: instance method of [<code>VaultPlugin</code>](#VaultPlugin)  
**Note**: Passes Buffer of renadom data to the next step  

| Param | Type | Description |
| --- | --- | --- |
| as | <code>AsyncSteps</code> | AsyncSteps interface |
| size | <code>integer</code> | how many bytes to generate |

<a name="VaultPlugin.registerPlugin"></a>

### VaultPlugin.registerPlugin(name, impl)
Register plugin

**Kind**: static method of [<code>VaultPlugin</code>](#VaultPlugin)  

| Param | Type | Description |
| --- | --- | --- |
| name | <code>string</code> | plugin identifier |
| impl | [<code>VaultPlugin</code>](#VaultPlugin) | plugin implementation |

<a name="VaultPlugin.getPlugin"></a>

### VaultPlugin.getPlugin(name) ⇒ [<code>VaultPlugin</code>](#VaultPlugin)
Get plugin by name

**Kind**: static method of [<code>VaultPlugin</code>](#VaultPlugin)  
**Returns**: [<code>VaultPlugin</code>](#VaultPlugin) - plugin instance  

| Param | Type | Description |
| --- | --- | --- |
| name | <code>string</code> | plugin identifier |

<a name="DBStorage"></a>

## DBStorage
Database Encrypted secret storage

**Kind**: global class  
<a name="EncryptedStorage"></a>

## EncryptedStorage
Encrypted secret storage base

Assume there is

**Kind**: global class  
<a name="EncryptedStorage+setStorageSecret"></a>

### encryptedStorage.setStorageSecret(as, secret, cipher_opts, kdf_opts)
Configure common storage secret which is used to encrypt keys

**Kind**: instance method of [<code>EncryptedStorage</code>](#EncryptedStorage)  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| as | <code>AsyncSteps</code> |  | AsyncSteps interface |
| secret | <code>Buffer</code> |  | some arbitrary secret |
| cipher_opts | <code>object</code> | <code>{}</code> | options for encryption/decryption |
| cipher_opts.type | <code>string</code> | <code>&quot;AES&quot;</code> | cipher type |
| cipher_opts.bits | <code>integer</code> | <code>256</code> | key length for KDF |
| cipher_opts.mode | <code>string</code> | <code>&quot;GCM&quot;</code> | cipher block mode |
| cipher_opts.aad | <code>string</code> | <code>&quot;SecVault&quot;</code> | additional auth data |
| kdf_opts | <code>object</code> \| <code>null</code> | <code>{}</code> | KDF options, null to disable |
| kdf_opts.type | <code>string</code> | <code>&quot;HKDF&quot;</code> | KDF type |
| kdf_opts.salt | <code>string</code> | <code>&quot;SecVault&quot;</code> | KDF salt |
| kdf_opts.info | <code>string</code> | <code>&quot;KEK&quot;</code> | info parameter for HKDF |
| kdf_opts.rounds | <code>string</code> | <code>1000</code> | rounds for PBKDF2 |

<a name="KeyInfo"></a>

## KeyInfo
Sealed key info

**Kind**: global class  
<a name="new_KeyInfo_new"></a>

### new KeyInfo(info)
C-tor


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| info | <code>object</code> | <code>{}</code> | optional default values |

<a name="Storage"></a>

## Storage
Secret storage base

**Kind**: global class  

