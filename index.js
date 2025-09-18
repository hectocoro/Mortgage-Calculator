// -----------------------------
// Helpers
// -----------------------------
function formatWithCommas(value) {
    if (!value) return "";

    // Remove all characters except digits and decimal
    let cleaned = value.replace(/[^0-9.]/g, "");

    // Only allow first decimal
    const decimalIndex = cleaned.indexOf(".");
    if (decimalIndex !== -1) {
        const intPart = cleaned.slice(0, decimalIndex);
        let decPart = cleaned.slice(decimalIndex + 1).replace(/\./g, ""); // remove any other dots
        const formattedInt = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        return decPart ? formattedInt + "." + decPart : formattedInt + ".";
    } else {
        // No decimal
        return cleaned.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    }
}




function getNumericValue(inputEl) {
    return parseFloat(inputEl.value.replace(/,/g, "")) || 0;
}

function formatCurrency(value) {
    // return "$" + Number(value || 0).toLocaleString("en-US");
    return "$" + Number(value || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

}

function calculatePayment({ price, down, rate, term, taxes, pmi, insurance }) {
    const principal = price - down;
    const monthlyRate = rate / 100 / 12;
    const n = term * 12;
    const mortgage = monthlyRate > 0
        ? principal * (monthlyRate * Math.pow(1 + monthlyRate, n)) / (Math.pow(1 + monthlyRate, n) - 1)
        : principal / n;
    return mortgage + taxes + pmi + insurance;
}

// -----------------------------
// Core Functions
// -----------------------------
// Calculate scenario from current form values and update result display.
function calculateScenario() {
    const scenario = {
        label: document.getElementById('label').value,
        price: getNumericValue(document.getElementById('price')),
        down: getNumericValue(document.getElementById('down')),
        rate: getNumericValue(document.getElementById('rate')),
        term: getNumericValue(document.getElementById('term')),
        taxes: getNumericValue(document.getElementById('taxes')),
        pmi: getNumericValue(document.getElementById('pmi')),
        insurance: getNumericValue(document.getElementById('insurance')),
    };
    scenario.monthly = calculatePayment(scenario);

    // Display result (do not save)
    document.getElementById('result').textContent = "Monthly Payment: " + formatCurrency(scenario.monthly);

    return scenario;
}

function saveScenario() {
    const scenario = calculateScenario();

    // Save scenario
    let scenarios = JSON.parse(localStorage.getItem("scenarios")) || [];
    scenarios.push(scenario);
    localStorage.setItem("scenarios", JSON.stringify(scenarios));

    renderScenarios();
}

function clearForm() {
    // Clear inputs
    document.getElementById('label').value = '';
    document.getElementById('price').value = '';
    document.getElementById('down').value = '';
    document.getElementById('rate').value = '';
    document.getElementById('term').value = '';
    document.getElementById('taxes').value = '';
    document.getElementById('pmi').value = '';
    document.getElementById('insurance').value = '';

    // Reset result
    document.getElementById('result').textContent = "Monthly Payment: $0";

    // move focus to first field
    document.getElementById('label').focus();
}

function renderScenarios() {
    const tbody = document.querySelector("#scenarioTable tbody");
    tbody.innerHTML = "";
    const scenarios = JSON.parse(localStorage.getItem("scenarios")) || [];

    scenarios.forEach((s, i) => {
        const row = document.createElement("tr");

        row.innerHTML = `
        <td>${i + 1}</td>
        <td>${s.label}</td>
        <td>${formatCurrency(s.price)}</td>
        <td>${formatCurrency(s.down)}</td>
        <td>${s.rate}%</td>
        <td>${s.term} yrs</td>
        <td>${formatCurrency(s.taxes)}</td>
        <td>${formatCurrency(s.pmi)}</td>
        <td>${formatCurrency(s.insurance)}</td>
        <td><b>${formatCurrency(s.monthly)}</b></td>
        <td></td>
        `;

        // Delete button
        const delBtn = document.createElement("button");
        delBtn.textContent = "X";
        delBtn.className = "delete-btn";
        delBtn.addEventListener("click", (ev) => {
            // prevent the row click from also firing
            ev.stopPropagation();
            deleteScenario(i);
        });
        row.querySelector("td:last-child").appendChild(delBtn);

        // Row click: populate form with this scenario. If user clicks the # column (index 0) populate the whole form;
        // otherwise only populate the single clicked field.
        row.addEventListener('click', (ev) => {
            const td = ev.target.closest('td');
            if (!td) return;
            const cellIndex = Array.from(row.querySelectorAll('td')).indexOf(td);
            // Map table column index -> input id
            // columns: 0:#, 1:Label, 2:Price, 3:Down, 4:Rate %, 5:Term, 6:Taxes, 7:PMI, 8:Insurance, 9:Monthly, 10:Action
            const colToField = {
                1: 'label',
                2: 'price',
                3: 'down',
                4: 'rate',
                5: 'term',
                6: 'taxes',
                7: 'pmi',
                8: 'insurance'
            };

            if (cellIndex === 0) {
                // load entire scenario into the form
                populateFormFromScenario(s, null);
                return;
            }

            const field = colToField[cellIndex] || null;
            if (field) {
                populateSingleFieldFromScenario(s, field);
            }
        });

        tbody.appendChild(row);
    });
}

// Populate the form inputs from a scenario object. If focusField is provided, focus that input.
function populateFormFromScenario(scenario, focusField = null) {
    if (!scenario) return;

    // text fields
    document.getElementById('label').value = scenario.label || '';

    // numeric fields - format with commas where appropriate
    document.getElementById('price').value = formatWithCommas(String(scenario.price || ''));
    document.getElementById('down').value = formatWithCommas(String(scenario.down || ''));
    document.getElementById('rate').value = scenario.rate != null ? String(scenario.rate) : '';
    document.getElementById('term').value = formatWithCommas(String(scenario.term || ''));
    document.getElementById('taxes').value = formatWithCommas(String(scenario.taxes || ''));
    document.getElementById('pmi').value = formatWithCommas(String(scenario.pmi || ''));
    document.getElementById('insurance').value = formatWithCommas(String(scenario.insurance || ''));

    // update calculated result display
    document.getElementById('result').textContent = "Monthly Payment: " + formatCurrency(scenario.monthly);

    // focus requested field and place cursor at end
    if (focusField) {
        const el = document.getElementById(focusField);
        if (el) {
            el.focus();
            // move caret to end
            const val = el.value;
            el.setSelectionRange && el.setSelectionRange(val.length, val.length);
        }
    }
}

// Populate only one field from a scenario and focus it.
function populateSingleFieldFromScenario(scenario, field) {
    if (!scenario || !field) return;

    const valMap = {
        label: scenario.label || '',
        price: formatWithCommas(String(scenario.price || '')),
        down: formatWithCommas(String(scenario.down || '')),
        rate: scenario.rate != null ? String(scenario.rate) : '',
        term: formatWithCommas(String(scenario.term || '')),
        taxes: formatWithCommas(String(scenario.taxes || '')),
        pmi: formatWithCommas(String(scenario.pmi || '')),
        insurance: formatWithCommas(String(scenario.insurance || '')),
        monthly: formatCurrency(scenario.monthly)
    };

    const el = document.getElementById(field);
    if (el && valMap.hasOwnProperty(field)) {
        el.value = valMap[field];
        el.focus();
        const val = el.value;
        el.setSelectionRange && el.setSelectionRange(val.length, val.length);
    }

    // Update monthly display in case monthly was clicked or to keep UI consistent
    document.getElementById('result').textContent = "Monthly Payment: " + formatCurrency(scenario.monthly);
}

function deleteScenario(index) {
    let scenarios = JSON.parse(localStorage.getItem("scenarios")) || [];
    scenarios.splice(index, 1);
    localStorage.setItem("scenarios", JSON.stringify(scenarios));
    renderScenarios();
}

// -----------------------------
// Event Listeners
// -----------------------------
window.addEventListener("load", () => {
    // render saved scenarios
    renderScenarios();

    // attach comma formatters to inputs
    document.querySelectorAll(".comma-input").forEach(el => {
        el.value = formatWithCommas(el.value);
        el.addEventListener("input", () => {
            el.value = formatWithCommas(el.value);
        });
    });
});

// Button wiring: Calculate updates the monthly display only. Save persists the current inputs as a scenario.
document.getElementById("calculateBtn").addEventListener("click", () => {
    calculateScenario();
});

document.getElementById("saveBtn").addEventListener("click", () => {
    saveScenario();
});

document.getElementById("clearBtn").addEventListener("click", () => {
    clearForm();
});

const priceInput = document.getElementById("price");
const downInput = document.getElementById("down");
const downPercentInput = document.getElementById("downPercent");

function getNumericValue(el) {
    return parseFloat(el.value.replace(/,/g, '')) || 0;
}

function updateDownPercent() {
    const price = getNumericValue(priceInput);
    const down = getNumericValue(downInput);
    downPercentInput.value = price === 0 ? '100' : ((down / price) * 100).toFixed(5);
}

function updateDownValue() {
    const price = getNumericValue(priceInput);
    const downPercent = getNumericValue(downPercentInput);
    downInput.value = price === 0 ? '' : formatWithCommas((downPercent * price / 100).toFixed(2));
}

function onPriceChange() {
    const price = getNumericValue(priceInput);
    const downPercent = getNumericValue(downPercentInput);
    const down = getNumericValue(downInput);

    if(downPercent !== 0) {
        updateDownValue();
    } else if(down !== 0) {
        updateDownPercent();
    }
}

// Event listeners
downInput.addEventListener("keyup", updateDownPercent);
downPercentInput.addEventListener("keyup", updateDownValue);
priceInput.addEventListener("keyup", onPriceChange);
