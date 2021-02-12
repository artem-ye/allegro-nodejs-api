async function setTimeoutAsync(ms) {

    return new Promise(resolve => {
        setTimeout(resolve, ms);
    });

}

exports.setTimeoutAsync = setTimeoutAsync; 
