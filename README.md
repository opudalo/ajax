# ajax

ajax micro library in ES6
an ES6 port of awesome [ForbesLindesay/ajax](https://github.com/ForbesLindesay/ajax) library

## Installation

- `npm i --save opudalo/ajax`  
or  
- `bower i --save opudalo/ajax`

## API

### ajax(url, settings) or ajax(settings)

**url** A string containing the URL to which the request is sent.  
**settings** A set of key/value pairs that configure the Ajax request. All settings are optional. A default can be set for any option with `ajax.settings`.

For a list of available settings see:

http://api.jquery.com/jQuery.ajax/

## Examples

```js
  import ajax from 'ajax'

  ajax({
    type: 'GET',
    url: 'http://www.google.com',
    dataType: 'html',
    crossDomain: true,
    success: function (data) {
      let hasDoctype = /<!doctype html>/.test(data)
      expect(hasDoctype).to.be.true
      done()
    }
  })

```

