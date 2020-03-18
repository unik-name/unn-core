afterEach(() => {
    // Launching all tests throws `MaxListenersExceededWarning: Possible EventEmitter memory leak detected` warning. In some tests we test stdout content, we can't have warnings
    process.stdout.removeAllListeners();
    process.stderr.removeAllListeners();
});
