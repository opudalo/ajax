import 'babel/polyfill'
import ajax from '../src/index'
import {expect} from 'chai'

describe('ajax basics', function () {
  it('should exist', function () {
    expect(typeof ajax).to.equal('function')
  })

  it('should send get request', function () {
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
  })
})
