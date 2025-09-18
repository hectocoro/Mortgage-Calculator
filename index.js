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
function saveScenario() {
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

    // Display result
    document.getElementById('result').textContent = "Monthly Payment: " + formatCurrency(scenario.monthly);

    // Save scenario
    let scenarios = JSON.parse(localStorage.getItem("scenarios")) || [];
    scenarios.push(scenario);
    localStorage.setItem("scenarios", JSON.stringify(scenarios));

    renderScenarios();
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
        delBtn.addEventListener("click", () => deleteScenario(i));
        row.querySelector("td:last-child").appendChild(delBtn);

        tbody.appendChild(row);
    });
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

document.getElementById("calculateBtn").addEventListener("click", saveScenario);