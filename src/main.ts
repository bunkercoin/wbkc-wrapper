const polygonRegex: RegExp = /^[0-9a-zA-Z]{40,40}/g;
const submit_buttons = document.querySelectorAll("#submit");

submit_buttons.forEach(async (button: Element) => {
    const stage: string | undefined = button.parentElement?.id;
    
    if (stage === "1") {
        button.addEventListener("click", async (event: Event) => {
            const input_field = <HTMLInputElement>submit_buttons[0].parentElement!.children[1];

            if (input_field.value && input_field.value.length === 42) {
                const validPolygonAddress: boolean = polygonRegex.test(input_field.value.slice(2));
            }

            submit_buttons[0].parentElement!.style.display = "none";
            submit_buttons[1].parentElement!.style.display = "block";
        });
    } else if (stage === "2") {

    } else if (stage === "3") {

    }
});