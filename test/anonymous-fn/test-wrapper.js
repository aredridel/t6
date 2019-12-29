// Example of wrapper function that would invoke tape
export default function (testCase) {
    return function (t) {
        setUp();
        testCase(t);
        tearDown();
    };
};

function setUp() {
    // ... example ...
}

function tearDown() {
    // ... example ...
}
