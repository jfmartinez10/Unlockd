'use strict';

function ok(data, message = 'OK') {
    return { success: true, message, data };
}

function fail(message = 'Error', errors = null) {
    const body = { success: false, message };
    if (errors) body.errors = errors;
    return body;
}

module.exports = { ok, fail };
