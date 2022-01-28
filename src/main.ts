// Config  variables
const polygonAddressRegex: RegExp = /^[0-9a-zA-Z]{40,40}/g;
const apiURL: string = `https://wrap.bunkercoin.xyz/api/`;
const minDeposit: number = 0.01;
const maxDeposit: number = 100;
const minConfirmations: number = 3;

// Buttons labeled submit
const submitButton1: Element | undefined | null = document.querySelector(`#submit1`);
const submitButton2: Element | undefined | null = document.querySelector(`#submit2`);
const submitButton3: Element | undefined | null = document.querySelector(`#submit3`);

submitButton1?.addEventListener(`click`, async (event: Event) => { // User clicks on submit button after entering a matic address (Step 1)
    const input_field = document.querySelector(`#stage1`)!.children[1] as HTMLInputElement;

    if (input_field.value && input_field.value.length === 42 && polygonAddressRegex.test(input_field.value.slice(2))) {
        // Get a desposit address from the API
        const response: Response = await fetch(`${apiURL}getDepositAddress/${input_field.value}`);
        const data = await response.json();

        // Check if the address is valid
        if (data[`message`][`addressMatic`] === input_field.value) {}

        // Continue to step 2
        (<HTMLElement>document.querySelector(`#stage1`)!).style.display = `none`;
        (<HTMLElement>document.querySelector(`#stage2`)!).style.display = `block`;
    } else {
        alert(`Please enter a valid polygon address`);
        return;
    }
});

submitButton2?.addEventListener(`click`, async (event: Event) => {
    const input_field = document.querySelector(`#stage2`)!.children[1] as HTMLInputElement;

    if (input_field.value && input_field.value.length === 42) {
        const validPolygonAddress: boolean = polygonAddressRegex.test(input_field.value.slice(2));
    }

    (<HTMLElement>document.querySelector(`#stage2`)!).style.display = `none`;
    (<HTMLElement>document.querySelector(`#stage3`)!).style.display = `block`;
});

submitButton3?.addEventListener(`click`, async (event: Event) => {
    const input_field = document.querySelector(`#stage3`)!.children[1] as HTMLInputElement;

    if (input_field.value && input_field.value.length === 42) {
        const validPolygonAddress: boolean = polygonAddressRegex.test(input_field.value.slice(2));
    }
});