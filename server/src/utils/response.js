export function ok(data, message = 'OK') {
    return { success: true, message, data };
}

export function fail(message = 'Error', errors = null) {
    const body = { success: false, message };
    if (errors) body.errors = errors;
    return body;
}
