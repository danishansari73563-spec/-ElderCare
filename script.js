// ============================================
// ELDERCARE - COMPLETE JAVASCRIPT
// CLEAN / CORRECTED VERSION
// Multiple Medicines + Multiple Reminder Times
// ============================================


// ============================================
// 1. NAVIGATION
// ============================================

function showSection(sectionId) {
    document.querySelectorAll(".section").forEach(section => {
        section.classList.remove("active-section");
    });

    const section = document.getElementById(sectionId);

    if (section) {
        section.classList.add("active-section");
    }

    document.querySelectorAll(".nav-item").forEach(button => {
        button.classList.remove("active");
    });

    const activeButton = document.querySelector(
        `.nav-item[onclick="showSection('${sectionId}')"]`
    );

    if (activeButton) {
        activeButton.classList.add("active");
    }

    const titles = {
        dashboard: "Dashboard",
        elderly: "Elderly Data",
        medicines: "Medicine Reminders",
        appointments: "Health Appointments",
        reports: "Reports & Data Analysis"
    };

    const title = document.getElementById("pageTitle");

    if (title) {
        title.textContent = titles[sectionId] || "ElderCare";
    }

    if (sectionId === "elderly") {
        renderElderlyData();
    }

    if (sectionId === "medicines") {
        renderMedicines();
    }

    if (sectionId === "appointments") {
        renderAppointments();
    }

    updateAllCounts();
}


// ============================================
// 2. ELDERLY DATA
// ============================================

let elderlyData = loadJSON("elderlyData", []);

if (!Array.isArray(elderlyData)) {
    elderlyData = [];
}

function saveElderlyData() {
    localStorage.setItem(
        "elderlyData",
        JSON.stringify(elderlyData)
    );
}


// ============================================
// 3. PHOTO PREVIEW
// ============================================

function previewElderlyPhoto(event) {
    const file = event.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
        alert("Please select an image file.");
        event.target.value = "";
        return;
    }

    const reader = new FileReader();

    reader.onload = function (e) {
        const preview = document.getElementById("photoPreview");
        const placeholder = document.getElementById("photoPlaceholder");

        if (preview) {
            preview.src = e.target.result;
            preview.style.display = "block";
        }

        if (placeholder) {
            placeholder.style.display = "none";
        }
    };

    reader.readAsDataURL(file);
}


// ============================================
// 4. RESET PHOTO
// ============================================

function resetPhotoPreview() {
    const preview = document.getElementById("photoPreview");
    const placeholder = document.getElementById("photoPlaceholder");
    const input = document.getElementById("elderlyPhoto");

    if (preview) {
        preview.src = "";
        preview.style.display = "none";
    }

    if (placeholder) {
        placeholder.style.display = "block";
    }

    if (input) {
        input.value = "";
    }
}


// ============================================
// 5. RENDER ELDERLY DATA
// ============================================
// NOTE: The table header only defines 7 columns
// (Name, Age, Gender, Health Problem, Medicines,
// Emergency Contact, Actions). "Medicines" is now
// pulled live from medicineData, since medicine info
// moved into its own multi-medicine modal and is no
// longer stored directly on the elderly record.

function renderElderlyData() {
    const tableBody = document.getElementById("elderlyTableBody");

    if (!tableBody) return;

    const searchInput = document.getElementById("searchElderly");

    const search = searchInput
        ? searchInput.value.toLowerCase().trim()
        : "";

    tableBody.innerHTML = "";

    const filtered = elderlyData.filter(person => {
        const personMedicineNames = medicineData
            .filter(med => med.elderly === person.name)
            .map(med => med.medicine)
            .join(", ")
            .toLowerCase();

        return (
            String(person.name || "")
                .toLowerCase()
                .includes(search) ||

            String(person.health || "")
                .toLowerCase()
                .includes(search) ||

            personMedicineNames.includes(search)
        );
    });

    if (filtered.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="7" class="empty-state">
                    No elderly records found.
                </td>
            </tr>
        `;

        return;
    }

    filtered.forEach(person => {
        const index = elderlyData.indexOf(person);

        const row = document.createElement("tr");

        const photoHTML = person.photo
            ? `
                <img
                    src="${escapeAttribute(person.photo)}"
                    alt="${escapeHTML(person.name || "Elderly")}"
                    style="
                        width:48px;
                        height:48px;
                        border-radius:50%;
                        object-fit:cover;
                        border:2px solid #eee;
                    "
                >
            `
            : `
                <div
                    style="
                        width:48px;
                        height:48px;
                        border-radius:50%;
                        display:flex;
                        align-items:center;
                        justify-content:center;
                        background:#f1f1f1;
                        font-size:22px;
                    "
                >
                    👤
                </div>
            `;

        const personMedicines = medicineData
            .filter(med => med.elderly === person.name)
            .map(med => med.medicine);

        const medicineDisplay = personMedicines.length > 0
            ? escapeHTML(personMedicines.join(", "))
            : "-";

        row.innerHTML = `
            <td>
                <div
                    style="
                        display:flex;
                        align-items:center;
                        gap:12px;
                    "
                >
                    ${photoHTML}

                    <strong>
                        ${escapeHTML(person.name || "-")}
                    </strong>
                </div>
            </td>

            <td>
                ${escapeHTML(person.age || "-")}
            </td>

            <td>
                ${escapeHTML(person.gender || "-")}
            </td>

            <td>
                ${escapeHTML(person.health || "-")}
            </td>

            <td>
                ${medicineDisplay}
            </td>

            <td>
                ${escapeHTML(person.contact || "-")}
            </td>

            <td>
                <div class="action-buttons">
                    <button
                        type="button"
                        class="share-btn"
                        onclick="shareElderly(${index})"
                        title="Share this record"
                    >
                        📤
                    </button>

                    <button
                        type="button"
                        class="edit-btn"
                        onclick="editElderly(${index})"
                    >
                        ✏️
                    </button>

                    <button
                        type="button"
                        class="delete-btn"
                        onclick="deleteElderly(${index})"
                    >
                        🗑️
                    </button>
                </div>
            </td>
        `;

        tableBody.appendChild(row);
    });
}


// ============================================
// 5B. SHARE ELDERLY RECORD
// ============================================

function buildElderlyShareText(person) {
    const personMedicines = medicineData.filter(
        med => med.elderly === person.name
    );

    const lines = [];

    lines.push(`👴 ${person.name || "-"}`);
    lines.push(`Age: ${person.age || "-"}  |  Gender: ${person.gender || "-"}`);
    lines.push(`Health Problem: ${person.health || "-"}`);

    if (person.bloodGroup) {
        lines.push(`Blood Group: ${person.bloodGroup}`);
    }

    if (personMedicines.length > 0) {
        lines.push("");
        lines.push("💊 Medicines:");

        personMedicines.forEach(med => {
            const times = Array.isArray(med.times) && med.times.length > 0
                ? med.times.map(t => `${t.type} ${formatTime(t.time)}`).join(", ")
                : "-";

            lines.push(`- ${med.medicine} (${med.dosage}) — ${med.frequency} — ${times}`);
        });
    }

    if (person.contact) {
        lines.push("");
        lines.push(`📞 Emergency Contact: ${person.contact}`);
    }

    if (person.caregiverName || person.caregiverContact) {
        lines.push(
            `🧑‍⚕️ Caregiver: ${person.caregiverName || "-"} ${
                person.caregiverContact ? "(" + person.caregiverContact + ")" : ""
            }`
        );
    }

    if (person.address) {
        lines.push(`📍 Address: ${person.address}`);
    }

    if (person.notes) {
        lines.push("");
        lines.push(`Notes: ${person.notes}`);
    }

    return lines.join("\n");
}

function shareElderly(index) {
    const person = elderlyData[index];

    if (!person) return;

    const text = buildElderlyShareText(person);

    if (navigator.share) {
        navigator
            .share({
                title: `${person.name || "Elderly"} - Care Record`,
                text: text
            })
            .catch(() => {
                // User cancelled or share failed silently; no action needed.
            });

        return;
    }

    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard
            .writeText(text)
            .then(() => {
                alert("Sharing is not supported on this device. Record copied to clipboard instead.");
            })
            .catch(() => {
                alert(text);
            });

        return;
    }

    alert(text);
}


// ============================================
// 6. OPEN ELDERLY FORM
// ============================================

function openElderlyForm() {
    const modal = document.getElementById("elderlyModal");
    const form = document.getElementById("elderlyForm");

    if (!modal || !form) return;

    form.reset();

    const editIndex = document.getElementById("editIndex");

    if (editIndex) {
        editIndex.value = "";
    }

    const title = document.getElementById("formTitle");

    if (title) {
        title.textContent = "Add Elderly Person";
    }

    resetPhotoPreview();

    modal.classList.add("show");
}


// ============================================
// 7. CLOSE ELDERLY FORM
// ============================================

function closeElderlyForm() {
    const modal = document.getElementById("elderlyModal");

    if (modal) {
        modal.classList.remove("show");
    }
}


// ============================================
// 8. SAVE ELDERLY
// ============================================
// NOTE: this form only collects elderly-person fields.
// Medicine name/time are handled entirely by the
// separate Medicine Reminder modal (saveMedicine),
// so they must NOT be looked up here.

function saveElderly(event) {
    if (event) {
        event.preventDefault();
    }

    const name = document.getElementById("elderlyName");
    const age = document.getElementById("elderlyAge");
    const gender = document.getElementById("elderlyGender");
    const health = document.getElementById("healthProblem");
    const contact = document.getElementById("emergencyContact");
    const address = document.getElementById("elderlyAddress");
    const bloodGroup = document.getElementById("bloodGroup");
    const caregiverName = document.getElementById("caregiverName");
    const caregiverContact = document.getElementById("caregiverContact");
    const notes = document.getElementById("elderlyNotes");
    const photoPreview = document.getElementById("photoPreview");

    if (
        !name ||
        !age ||
        !gender ||
        !health ||
        !contact
    ) {
        alert("Some form fields are missing in HTML.");
        return;
    }

    const person = {
        name: name.value.trim(),
        age: age.value ? Number(age.value) : "",
        gender: gender.value,
        health: health.value.trim(),
        contact: contact.value.trim(),
        address: address ? address.value.trim() : "",
        bloodGroup: bloodGroup ? bloodGroup.value : "",
        caregiverName: caregiverName ? caregiverName.value.trim() : "",
        caregiverContact: caregiverContact ? caregiverContact.value.trim() : "",
        notes: notes ? notes.value.trim() : "",

        photo:
            photoPreview &&
            photoPreview.src &&
            photoPreview.style.display !== "none"
                ? photoPreview.src
                : ""
    };

    if (!person.name) {
        alert("Please enter elderly person's name.");
        name.focus();
        return;
    }

    if (!person.age) {
        alert("Please enter age.");
        age.focus();
        return;
    }

    if (!person.gender) {
        alert("Please select gender.");
        gender.focus();
        return;
    }

    const editIndexElement = document.getElementById("editIndex");

    const editIndex = editIndexElement
        ? editIndexElement.value
        : "";

    let previousName = "";

    if (editIndex === "") {
        elderlyData.push(person);
    } else {
        const index = Number(editIndex);

        if (
            Number.isInteger(index) &&
            elderlyData[index]
        ) {
            previousName = elderlyData[index].name || "";
            elderlyData[index] = person;
        } else {
            elderlyData.push(person);
        }
    }

    // Keep medicine/appointment records pointing at the
    // right person if their name was changed while editing.
    if (previousName && previousName !== person.name) {
        medicineData.forEach(med => {
            if (med.elderly === previousName) {
                med.elderly = person.name;
            }
        });

        appointmentData.forEach(appt => {
            if (appt.elderly === previousName) {
                appt.elderly = person.name;
            }
        });

        saveMedicineData();
        saveAppointmentData();
    }

    saveElderlyData();
    renderElderlyData();
    closeElderlyForm();
    updateAllCounts();
    loadElderlyOptions();
    loadAppointmentOptions();

    alert("Elderly record saved successfully.");
}


// ============================================
// 9. EDIT ELDERLY
// ============================================

function editElderly(index) {
    const person = elderlyData[index];

    if (!person) return;

    const form = document.getElementById("elderlyForm");

    if (!form) return;

    document.getElementById("formTitle").textContent =
        "Edit Elderly Person";

    document.getElementById("editIndex").value = index;

    document.getElementById("elderlyName").value =
        person.name || "";

    document.getElementById("elderlyAge").value =
        person.age || "";

    document.getElementById("elderlyGender").value =
        person.gender || "";

    document.getElementById("healthProblem").value =
        person.health || "";

    document.getElementById("emergencyContact").value =
        person.contact || "";

    const addressField = document.getElementById("elderlyAddress");

    if (addressField) {
        addressField.value = person.address || "";
    }

    const bloodGroupField = document.getElementById("bloodGroup");

    if (bloodGroupField) {
        bloodGroupField.value = person.bloodGroup || "";
    }

    const caregiverNameField = document.getElementById("caregiverName");

    if (caregiverNameField) {
        caregiverNameField.value = person.caregiverName || "";
    }

    const caregiverContactField = document.getElementById("caregiverContact");

    if (caregiverContactField) {
        caregiverContactField.value = person.caregiverContact || "";
    }

    const notesField = document.getElementById("elderlyNotes");

    if (notesField) {
        notesField.value = person.notes || "";
    }

    const preview = document.getElementById("photoPreview");
    const placeholder = document.getElementById("photoPlaceholder");

    if (person.photo && preview && placeholder) {
        preview.src = person.photo;
        preview.style.display = "block";
        placeholder.style.display = "none";
    } else {
        resetPhotoPreview();
    }

    const modal = document.getElementById("elderlyModal");

    if (modal) {
        modal.classList.add("show");
    }
}


// ============================================
// 10. DELETE ELDERLY
// ============================================

function deleteElderly(index) {
    const person = elderlyData[index];

    if (!person) return;

    if (
        !confirm(
            `Delete ${person.name || "this person's"} record?`
        )
    ) {
        return;
    }

    elderlyData.splice(index, 1);

    saveElderlyData();
    renderElderlyData();
    updateAllCounts();
    loadElderlyOptions();
    loadAppointmentOptions();
}


// ============================================
// 11. MEDICINE DATA
// ============================================

let medicineData = loadJSON("medicineData", []);

if (!Array.isArray(medicineData)) {
    medicineData = [];
}


// ============================================
// 12. MIGRATE OLD MEDICINE DATA
// ============================================

function migrateMedicineData() {
    if (!Array.isArray(medicineData)) {
        medicineData = [];
        saveMedicineData();
        return;
    }

    if (medicineData.length === 0) {
        return;
    }

    const alreadyNewFormat = medicineData.every(item =>
        Array.isArray(item.times)
    );

    if (alreadyNewFormat) {
        return;
    }

    const grouped = {};

    medicineData.forEach(item => {
        const key = [
            item.elderly || "",
            item.medicine || "",
            item.dosage || "",
            item.frequency || "",
            item.status || ""
        ].join("|||");

        if (!grouped[key]) {
            grouped[key] = {
                id:
                    item.id ||
                    Date.now() +
                    Math.random(),

                elderly: item.elderly || "",
                medicine: item.medicine || "",
                dosage: item.dosage || "",
                frequency: item.frequency || "",
                status: item.status || "Active",
                times: []
            };
        }

        if (item.time) {
            grouped[key].times.push({
                type: item.timeType || "Other",
                time: item.time
            });
        }
    });

    medicineData = Object.values(grouped);

    saveMedicineData();
}

migrateMedicineData();


// ============================================
// 13. SAVE MEDICINE DATA
// ============================================

function saveMedicineData() {
    localStorage.setItem(
        "medicineData",
        JSON.stringify(medicineData)
    );
}


// ============================================
// 14. LOAD ELDERLY OPTIONS
// ============================================

function loadElderlyOptions() {
    const select = document.getElementById("medicineElderly");

    if (!select) return;

    const currentValue = select.value;

    select.innerHTML = `
        <option value="">
            Select Person
        </option>
    `;

    elderlyData.forEach(person => {
        const option = document.createElement("option");

        option.value = person.name || "";
        option.textContent = person.name || "Unnamed";

        select.appendChild(option);
    });

    if (
        currentValue &&
        elderlyData.some(
            person => person.name === currentValue
        )
    ) {
        select.value = currentValue;
    }
}


// ============================================
// 15. REQUIRED TIME COUNT
// ============================================

function getRequiredTimeCount(frequency) {
    switch (frequency) {
        case "Once a day":
            return 1;

        case "Twice a day":
            return 2;

        case "Three times a day":
            return 3;

        case "Four times a day":
            return 4;

        default:
            return 1;
    }
}


// ============================================
// 16. DEFAULT TIME SETTINGS
// ============================================

function getDefaultTimeSettings(count) {
    const defaults = [
        {
            type: "Morning",
            time: "08:00"
        },
        {
            type: "Afternoon",
            time: "13:00"
        },
        {
            type: "Evening",
            time: "18:00"
        },
        {
            type: "Night",
            time: "21:00"
        }
    ];

    return defaults.slice(0, count);
}


// ============================================
// 17. CREATE MEDICINE ROW
// ============================================

function createMedicineRow() {
    const row = document.createElement("div");

    row.className = "medicine-entry";

    row.innerHTML = `
        <div class="medicine-entry-header">
            <h3>💊 Medicine</h3>

            <button
                type="button"
                class="remove-medicine-btn"
                onclick="removeMedicineRow(this)"
            >
                🗑️ Remove
            </button>
        </div>

        <div class="form-grid">

            <div class="form-group">
                <label>Medicine Name</label>

                <input
                    type="text"
                    class="medicine-name"
                    placeholder="e.g. Paracetamol"
                    required
                >
            </div>

            <div class="form-group">
                <label>Dosage</label>

                <input
                    type="text"
                    class="medicine-dosage"
                    placeholder="e.g. 250 mg"
                    required
                >
            </div>

            <div class="form-group">
                <label>Frequency</label>

                <select
                    class="medicine-frequency"
                    required
                >
                    <option value="">
                        Select Frequency
                    </option>

                    <option value="Once a day">
                        Once a day
                    </option>

                    <option value="Twice a day">
                        Twice a day
                    </option>

                    <option value="Three times a day">
                        Three times a day
                    </option>

                    <option value="Four times a day">
                        Four times a day
                    </option>

                    <option value="As prescribed">
                        As prescribed
                    </option>
                </select>
            </div>

            <div class="form-group">
                <label>Status</label>

                <select
                    class="medicine-status"
                    required
                >
                    <option value="Active">
                        Active
                    </option>

                    <option value="Paused">
                        Paused
                    </option>
                </select>
            </div>

        </div>

        <div class="medicine-times-section">

            <div class="times-header">
                <strong>
                    ⏰ Reminder Times
                </strong>

                <button
                    type="button"
                    class="add-time-btn"
                    onclick="addTimeRow(this)"
                >
                    + Add Time
                </button>
            </div>

            <div class="time-rows">
                ${createTimeRowHTML("Morning", "08:00")}
            </div>

        </div>
    `;

    const frequencySelect =
        row.querySelector(".medicine-frequency");

    if (frequencySelect) {
        frequencySelect.addEventListener(
            "change",
            function () {
                updateMedicineTimeRows(row);
            }
        );
    }

    return row;
}


// ============================================
// 18. CREATE TIME ROW
// ============================================

function createTimeRowHTML(
    type = "Morning",
    time = ""
) {
    return `
        <div class="time-row">

            <select class="extra-time-type">

                <option
                    value="Morning"
                    ${type === "Morning" ? "selected" : ""}
                >
                    🌅 Morning
                </option>

                <option
                    value="Afternoon"
                    ${type === "Afternoon" ? "selected" : ""}
                >
                    ☀️ Afternoon
                </option>

                <option
                    value="Evening"
                    ${type === "Evening" ? "selected" : ""}
                >
                    🌆 Evening
                </option>

                <option
                    value="Night"
                    ${type === "Night" ? "selected" : ""}
                >
                    🌙 Night
                </option>

                <option
                    value="Other"
                    ${type === "Other" ? "selected" : ""}
                >
                    ⏰ Other
                </option>

            </select>

            <input
                type="time"
                class="extra-time"
                value="${escapeAttribute(time)}"
                required
            >

            <button
                type="button"
                class="remove-time-btn"
                onclick="removeTimeRow(this)"
            >
                ×
            </button>

        </div>
    `;
}


// ============================================
// 19. UPDATE TIME ROWS BY FREQUENCY
// ============================================

function updateMedicineTimeRows(medicineRow) {
    if (!medicineRow) return;

    const frequencySelect =
        medicineRow.querySelector(".medicine-frequency");

    const timeRows =
        medicineRow.querySelector(".time-rows");

    if (!frequencySelect || !timeRows) {
        return;
    }

    const frequency = frequencySelect.value;

    if (!frequency) {
        return;
    }

    if (frequency === "As prescribed") {
        timeRows.innerHTML =
            createTimeRowHTML("Other", "");

        return;
    }

    const count =
        getRequiredTimeCount(frequency);

    const defaults =
        getDefaultTimeSettings(count);

    timeRows.innerHTML = "";

    defaults.forEach(item => {
        const wrapper = document.createElement("div");

        wrapper.innerHTML =
            createTimeRowHTML(
                item.type,
                item.time
            );

        if (wrapper.firstElementChild) {
            timeRows.appendChild(
                wrapper.firstElementChild
            );
        }
    });
}


// ============================================
// 20. ADD MEDICINE ROW
// ============================================

function addMedicineRow() {
    const container =
        document.getElementById("medicineRows");

    if (!container) return;

    const row = createMedicineRow();

    container.appendChild(row);
}


// ============================================
// 21. REMOVE MEDICINE ROW
// ============================================

function removeMedicineRow(button) {
    if (!button) return;

    const row =
        button.closest(".medicine-entry");

    if (!row) return;

    const container =
        document.getElementById("medicineRows");

    if (!container) return;

    const rows =
        container.querySelectorAll(
            ".medicine-entry"
        );

    if (rows.length === 1) {
        alert(
            "At least one medicine is required."
        );

        return;
    }

    row.remove();
}


// ============================================
// 22. ADD TIME
// ============================================

function addTimeRow(button) {
    if (!button) return;

    const medicineEntry =
        button.closest(".medicine-entry");

    if (!medicineEntry) return;

    const timeRows =
        medicineEntry.querySelector(".time-rows");

    if (!timeRows) return;

    const wrapper =
        document.createElement("div");

    wrapper.innerHTML =
        createTimeRowHTML(
            "Other",
            ""
        );

    if (wrapper.firstElementChild) {
        timeRows.appendChild(
            wrapper.firstElementChild
        );
    }
}


// ============================================
// 23. REMOVE TIME
// ============================================

function removeTimeRow(button) {
    if (!button) return;

    const row =
        button.closest(".time-row");

    if (!row) return;

    const container =
        row.parentElement;

    if (!container) return;

    const rows =
        container.querySelectorAll(
            ".time-row"
        );

    if (rows.length === 1) {
        alert(
            "At least one reminder time is required."
        );

        return;
    }

    row.remove();
}


// ============================================
// 24. OPEN MEDICINE FORM
// ============================================

function openMedicineForm(personName = "") {
    loadElderlyOptions();

    const form =
        document.getElementById("medicineForm");

    const container =
        document.getElementById("medicineRows");

    if (!form || !container) return;

    form.reset();

    container.innerHTML = "";

    addMedicineRow();

    const select =
        document.getElementById("medicineElderly");

    if (select && personName) {
        select.value = personName;
    }

    const title =
        document.getElementById("medicineFormTitle");

    if (title) {
        title.textContent =
            "Add Medicine Reminder";
    }

    delete form.dataset.editIndex;

    const modal =
        document.getElementById("medicineModal");

    if (modal) {
        modal.classList.add("show");
    }
}


// ============================================
// 25. CLOSE MEDICINE FORM
// ============================================

function closeMedicineForm() {
    const modal =
        document.getElementById("medicineModal");

    if (modal) {
        modal.classList.remove("show");
    }
}


// ============================================
// 26. SAVE MEDICINES
// ============================================

function saveMedicine(event) {
    if (event) {
        event.preventDefault();
    }

    const elderlyElement =
        document.getElementById("medicineElderly");

    if (!elderlyElement) {
        alert(
            "Medicine person field is missing in HTML."
        );

        return;
    }

    const elderly =
        elderlyElement.value.trim();

    if (!elderly) {
        alert(
            "Please select an elderly person."
        );

        elderlyElement.focus();

        return;
    }

    const medicineRows =
        document.querySelectorAll(
            "#medicineRows .medicine-entry"
        );

    if (medicineRows.length === 0) {
        alert(
            "Please add at least one medicine."
        );

        return;
    }

    const newMedicines = [];

    for (const row of medicineRows) {

        const nameElement =
            row.querySelector(".medicine-name");

        const dosageElement =
            row.querySelector(".medicine-dosage");

        const frequencyElement =
            row.querySelector(".medicine-frequency");

        const statusElement =
            row.querySelector(".medicine-status");

        if (
            !nameElement ||
            !dosageElement ||
            !frequencyElement ||
            !statusElement
        ) {
            alert(
                "Some medicine fields are missing."
            );

            return;
        }

        const name =
            nameElement.value.trim();

        const dosage =
            dosageElement.value.trim();

        const frequency =
            frequencyElement.value;

        const status =
            statusElement.value;

        const timeRows =
            row.querySelectorAll(".time-row");

        const times = [];

        timeRows.forEach(timeRow => {

            const typeElement =
                timeRow.querySelector(
                    ".extra-time-type"
                );

            const timeElement =
                timeRow.querySelector(
                    ".extra-time"
                );

            if (!typeElement || !timeElement) {
                return;
            }

            const type =
                typeElement.value;

            const time =
                timeElement.value;

            if (time) {
                times.push({
                    type: type,
                    time: time
                });
            }
        });

        if (!name) {
            alert(
                "Please enter medicine name."
            );

            nameElement.focus();

            return;
        }

        if (!dosage) {
            alert(
                "Please enter medicine dosage."
            );

            dosageElement.focus();

            return;
        }

        if (!frequency) {
            alert(
                "Please select medicine frequency."
            );

            frequencyElement.focus();

            return;
        }

        const requiredCount =
            frequency === "As prescribed"
                ? 1
                : getRequiredTimeCount(frequency);

        if (times.length < requiredCount) {
            alert(
                `${name} requires ${requiredCount} reminder time(s).`
            );

            return;
        }

        newMedicines.push({
            id:
                Date.now() +
                Math.random(),

            elderly: elderly,
            medicine: name,
            dosage: dosage,
            frequency: frequency,
            status: status || "Active",
            times: times
        });
    }

    if (newMedicines.length === 0) {
        alert(
            "Please fill all medicine details."
        );

        return;
    }

    const form =
        document.getElementById("medicineForm");

    if (!form) {
        alert(
            "Medicine form not found."
        );

        return;
    }

    const editIndex =
        form.dataset.editIndex;

    if (
        editIndex !== undefined &&
        editIndex !== ""
    ) {
        const index = Number(editIndex);

        if (
            Number.isInteger(index) &&
            medicineData[index]
        ) {
            medicineData[index] =
                newMedicines[0];
        } else {
            medicineData.push(
                ...newMedicines
            );
        }
    } else {
        medicineData.push(
            ...newMedicines
        );
    }

    saveMedicineData();
    renderMedicines();
    renderElderlyData();
    closeMedicineForm();
    updateAllCounts();

    alert(
        editIndex !== undefined &&
        editIndex !== ""
            ? "Medicine updated successfully."
            : "Medicine reminders saved successfully."
    );
}


// ============================================
// 27. RENDER MEDICINES
// ============================================

function renderMedicines() {
    const container =
        document.getElementById("medicineList");

    if (!container) return;

    const searchInput =
        document.getElementById("searchMedicine");

    const search = searchInput
        ? searchInput.value.toLowerCase().trim()
        : "";

    container.innerHTML = "";

    const filtered =
        medicineData.filter(item => {
            return (
                String(item.medicine || "")
                    .toLowerCase()
                    .includes(search) ||

                String(item.elderly || "")
                    .toLowerCase()
                    .includes(search)
            );
        });

    if (filtered.length === 0) {
        container.innerHTML = `
            <div class="empty-medicine">
                No medicine reminders found.
            </div>
        `;

        return;
    }

    const grouped = {};

    filtered.forEach(item => {
        const personName =
            item.elderly || "Unknown Person";

        if (!grouped[personName]) {
            grouped[personName] = [];
        }

        grouped[personName].push(item);
    });

    Object.keys(grouped).forEach(personName => {

        const personMedicines =
            grouped[personName];

        const card =
            document.createElement("div");

        card.className =
            "person-medicine-card";

        let medicinesHTML = "";

        personMedicines.forEach(item => {

            const index =
                medicineData.indexOf(item);

            let timesHTML = "";

            if (
                Array.isArray(item.times) &&
                item.times.length > 0
            ) {
                timesHTML =
                    item.times.map(timeItem => {
                        return `
                            <div class="medicine-time-display">

                                <span>
                                    ${getTimeIcon(timeItem.type)}

                                    ${escapeHTML(
                                        timeItem.type || "Time"
                                    )}
                                </span>

                                <strong>
                                    ⏰
                                    ${formatTime(timeItem.time)}
                                </strong>

                            </div>
                        `;
                    }).join("");
            }

            medicinesHTML += `
                <div class="grouped-medicine">

                    <div class="grouped-medicine-main">

                        <div class="medicine-icon-large">
                            💊
                        </div>

                        <div class="grouped-medicine-info">

                            <div class="medicine-title-row">

                                <h3>
                                    ${escapeHTML(
                                        item.medicine || "-"
                                    )}
                                </h3>

                                <span
                                    class="status ${
                                        item.status === "Active"
                                            ? "active"
                                            : "paused"
                                    }"
                                >
                                    ${escapeHTML(
                                        item.status || "Active"
                                    )}
                                </span>

                            </div>

                            <p>
                                💉
                                ${escapeHTML(
                                    item.dosage || "-"
                                )}
                            </p>

                            <p class="medicine-frequency">
                                🔄
                                ${escapeHTML(
                                    item.frequency || "-"
                                )}
                            </p>

                            <div class="medicine-all-times">
                                ${timesHTML}
                            </div>

                            <div class="medicine-actions">

                                <button
                                    type="button"
                                    class="edit-btn"
                                    onclick="editMedicine(${index})"
                                >
                                    ✏️ Edit
                                </button>

                                <button
                                    type="button"
                                    class="delete-btn"
                                    onclick="deleteMedicine(${index})"
                                >
                                    🗑️ Delete
                                </button>

                            </div>

                        </div>

                    </div>

                </div>
            `;
        });

        card.innerHTML = `
            <div class="person-medicine-header">

                <div>

                    <h2>
                        👴
                        ${escapeHTML(personName)}
                    </h2>

                    <p>
                        ${personMedicines.length}
                        medicine(s)
                    </p>

                </div>

                <button
                    type="button"
                    class="primary-btn small-btn"
                    data-person="${escapeAttribute(personName)}"
                    onclick="openMedicineForPerson(this.dataset.person)"
                >
                    + Add Medicine
                </button>

            </div>

            <div class="grouped-medicine-list">
                ${medicinesHTML}
            </div>
        `;

        container.appendChild(card);
    });
}


// ============================================
// 28. ADD MEDICINE FOR PERSON
// ============================================

function openMedicineForPerson(personName) {
    openMedicineForm(personName);
}


// ============================================
// 29. EDIT MEDICINE
// ============================================

function editMedicine(index) {
    const item =
        medicineData[index];

    if (!item) return;

    loadElderlyOptions();

    const form =
        document.getElementById("medicineForm");

    const container =
        document.getElementById("medicineRows");

    if (!form || !container) return;

    form.reset();

    container.innerHTML = "";

    const row =
        createMedicineRow();

    container.appendChild(row);

    const elderlySelect =
        document.getElementById("medicineElderly");

    if (elderlySelect) {
        elderlySelect.value =
            item.elderly || "";
    }

    const nameElement =
        row.querySelector(".medicine-name");

    const dosageElement =
        row.querySelector(".medicine-dosage");

    const frequencyElement =
        row.querySelector(".medicine-frequency");

    const statusElement =
        row.querySelector(".medicine-status");

    if (nameElement) {
        nameElement.value =
            item.medicine || "";
    }

    if (dosageElement) {
        dosageElement.value =
            item.dosage || "";
    }

    if (frequencyElement) {
        frequencyElement.value =
            item.frequency || "";
    }

    if (statusElement) {
        statusElement.value =
            item.status || "Active";
    }

    const timeRows =
        row.querySelector(".time-rows");

    if (timeRows) {
        timeRows.innerHTML = "";

        if (
            Array.isArray(item.times) &&
            item.times.length > 0
        ) {
            item.times.forEach(timeItem => {

                const wrapper =
                    document.createElement("div");

                wrapper.innerHTML =
                    createTimeRowHTML(
                        timeItem.type || "Other",
                        timeItem.time || ""
                    );

                if (wrapper.firstElementChild) {
                    timeRows.appendChild(
                        wrapper.firstElementChild
                    );
                }
            });
        } else {
            timeRows.innerHTML =
                createTimeRowHTML(
                    "Morning",
                    "08:00"
                );
        }
    }

    const title =
        document.getElementById(
            "medicineFormTitle"
        );

    if (title) {
        title.textContent =
            "Edit Medicine Reminder";
    }

    form.dataset.editIndex =
        String(index);

    const modal =
        document.getElementById(
            "medicineModal"
        );

    if (modal) {
        modal.classList.add("show");
    }
}


// ============================================
// 30. DELETE MEDICINE
// ============================================

function deleteMedicine(index) {
    const item =
        medicineData[index];

    if (!item) return;

    if (
        !confirm(
            `Delete ${item.medicine || "this medicine"} reminder?`
        )
    ) {
        return;
    }

    medicineData.splice(index, 1);

    saveMedicineData();
    renderMedicines();
    renderElderlyData();
    updateAllCounts();
}


// ============================================
// 31. APPOINTMENT DATA
// ============================================

let appointmentData =
    loadJSON("appointmentData", []);

if (!Array.isArray(appointmentData)) {
    appointmentData = [];
}


// ============================================
// 32. SAVE APPOINTMENTS
// ============================================

function saveAppointmentData() {
    localStorage.setItem(
        "appointmentData",
        JSON.stringify(appointmentData)
    );
}


// ============================================
// 33. LOAD APPOINTMENT OPTIONS
// ============================================

function loadAppointmentOptions() {
    const select =
        document.getElementById(
            "appointmentElderly"
        );

    if (!select) return;

    const currentValue =
        select.value;

    select.innerHTML = `
        <option value="">
            Select Person
        </option>
    `;

    elderlyData.forEach(person => {

        const option =
            document.createElement("option");

        option.value =
            person.name || "";

        option.textContent =
            person.name || "Unnamed";

        select.appendChild(option);
    });

    if (
        currentValue &&
        elderlyData.some(
            person =>
                person.name === currentValue
        )
    ) {
        select.value =
            currentValue;
    }
}


// ============================================
// 34. RENDER APPOINTMENTS
// ============================================

function renderAppointments() {
    const container =
        document.getElementById(
            "appointmentList"
        );

    if (!container) return;

    const searchInput =
        document.getElementById(
            "searchAppointment"
        );

    const search = searchInput
        ? searchInput.value
            .toLowerCase()
            .trim()
        : "";

    container.innerHTML = "";

    const filtered =
        appointmentData.filter(item => {

            return (
                String(item.elderly || "")
                    .toLowerCase()
                    .includes(search) ||

                String(item.doctor || "")
                    .toLowerCase()
                    .includes(search) ||

                String(item.type || "")
                    .toLowerCase()
                    .includes(search)
            );
        });

    if (filtered.length === 0) {
        container.innerHTML = `
            <div class="empty-medicine">
                No appointments found.
            </div>
        `;

        return;
    }

    filtered.forEach(item => {

        const index =
            appointmentData.indexOf(item);

        const card =
            document.createElement("div");

        card.className =
            "large-appointment-card";

        card.innerHTML = `
            <div class="calendar-icon">
                📅
            </div>

            <div class="appointment-content">

                <span>
                    ${formatDate(item.date)}
                    •
                    ${formatTime(item.time)}
                </span>

                <h3>
                    ${escapeHTML(
                        item.doctor || "-"
                    )}
                </h3>

                <p>
                    👴
                    ${escapeHTML(
                        item.elderly || "-"
                    )}
                    •
                    ${escapeHTML(
                        item.type || "-"
                    )}
                </p>

                <p>
                    📍
                    ${escapeHTML(
                        item.location || "-"
                    )}
                </p>

                <div class="medicine-actions">

                    <button
                        type="button"
                        class="edit-btn"
                        onclick="editAppointment(${index})"
                    >
                        ✏️ Edit
                    </button>

                    <button
                        type="button"
                        class="delete-btn"
                        onclick="deleteAppointment(${index})"
                    >
                        🗑️ Delete
                    </button>

                </div>

            </div>
        `;

        container.appendChild(card);
    });
}


// ============================================
// 35. OPEN APPOINTMENT
// ============================================

function openAppointmentForm() {
    loadAppointmentOptions();

    const form =
        document.getElementById(
            "appointmentForm"
        );

    if (!form) return;

    form.reset();

    const editIndex =
        document.getElementById(
            "appointmentEditIndex"
        );

    if (editIndex) {
        editIndex.value = "";
    }

    const title =
        document.getElementById(
            "appointmentFormTitle"
        );

    if (title) {
        title.textContent =
            "Add Appointment";
    }

    const modal =
        document.getElementById(
            "appointmentModal"
        );

    if (modal) {
        modal.classList.add("show");
    }
}


// ============================================
// 36. CLOSE APPOINTMENT
// ============================================

function closeAppointmentForm() {
    const modal =
        document.getElementById(
            "appointmentModal"
        );

    if (modal) {
        modal.classList.remove("show");
    }
}


// ============================================
// 37. SAVE APPOINTMENT
// ============================================

function saveAppointment(event) {
    if (event) {
        event.preventDefault();
    }

    const elderlyElement =
        document.getElementById(
            "appointmentElderly"
        );

    const doctorElement =
        document.getElementById(
            "doctorName"
        );

    const dateElement =
        document.getElementById(
            "appointmentDate"
        );

    const timeElement =
        document.getElementById(
            "appointmentTime"
        );

    const typeElement =
        document.getElementById(
            "appointmentType"
        );

    const locationElement =
        document.getElementById(
            "appointmentLocation"
        );

    if (
        !elderlyElement ||
        !doctorElement ||
        !dateElement ||
        !timeElement ||
        !typeElement ||
        !locationElement
    ) {
        alert(
            "Some appointment form fields are missing in HTML."
        );

        return;
    }

    const appointment = {
        elderly:
            elderlyElement.value,

        doctor:
            doctorElement.value.trim(),

        date:
            dateElement.value,

        time:
            timeElement.value,

        type:
            typeElement.value,

        location:
            locationElement.value.trim()
    };

    if (!appointment.elderly) {
        alert(
            "Please select a person."
        );

        elderlyElement.focus();

        return;
    }

    if (!appointment.doctor) {
        alert(
            "Please enter doctor name."
        );

        doctorElement.focus();

        return;
    }

    if (!appointment.date) {
        alert(
            "Please select appointment date."
        );

        dateElement.focus();

        return;
    }

    if (!appointment.time) {
        alert(
            "Please select appointment time."
        );

        timeElement.focus();

        return;
    }

    if (!appointment.type) {
        alert(
            "Please select appointment type."
        );

        typeElement.focus();

        return;
    }

    const editIndexElement =
        document.getElementById(
            "appointmentEditIndex"
        );

    const editIndex =
        editIndexElement
            ? editIndexElement.value
            : "";

    if (editIndex === "") {

        appointmentData.push(
            appointment
        );

    } else {

        const index =
            Number(editIndex);

        if (
            Number.isInteger(index) &&
            appointmentData[index]
        ) {
            appointmentData[index] =
                appointment;
        } else {
            appointmentData.push(
                appointment
            );
        }
    }

    saveAppointmentData();
    renderAppointments();
    closeAppointmentForm();
    updateAllCounts();

    alert(
        "Appointment saved successfully."
    );
}


// ============================================
// 38. EDIT APPOINTMENT
// ============================================

function editAppointment(index) {
    const item =
        appointmentData[index];

    if (!item) return;

    loadAppointmentOptions();

    const title =
        document.getElementById(
            "appointmentFormTitle"
        );

    if (title) {
        title.textContent =
            "Edit Appointment";
    }

    const editIndex =
        document.getElementById(
            "appointmentEditIndex"
        );

    if (editIndex) {
        editIndex.value =
            index;
    }

    const elderly =
        document.getElementById(
            "appointmentElderly"
        );

    const doctor =
        document.getElementById(
            "doctorName"
        );

    const date =
        document.getElementById(
            "appointmentDate"
        );

    const time =
        document.getElementById(
            "appointmentTime"
        );

    const type =
        document.getElementById(
            "appointmentType"
        );

    const location =
        document.getElementById(
            "appointmentLocation"
        );

    if (elderly) {
        elderly.value =
            item.elderly || "";
    }

    if (doctor) {
        doctor.value =
            item.doctor || "";
    }

    if (date) {
        date.value =
            item.date || "";
    }

    if (time) {
        time.value =
            item.time || "";
    }

    if (type) {
        type.value =
            item.type || "";
    }

    if (location) {
        location.value =
            item.location || "";
    }

    const modal =
        document.getElementById(
            "appointmentModal"
        );

    if (modal) {
        modal.classList.add("show");
    }
}


// ============================================
// 39. DELETE APPOINTMENT
// ============================================

function deleteAppointment(index) {
    const item =
        appointmentData[index];

    if (!item) return;

    if (
        !confirm(
            `Delete appointment with ${item.doctor || "this doctor"}?`
        )
    ) {
        return;
    }

    appointmentData.splice(
        index,
        1
    );

    saveAppointmentData();
    renderAppointments();
    updateAllCounts();
}


// ============================================
// 40. COUNTS
// ============================================

function updateAllCounts() {

    const elderlyCount =
        elderlyData.length;

    const medicineCount =
        medicineData.length;

    const appointmentCount =
        appointmentData.length;

    const activeMedicineCount =
        medicineData.filter(
            item =>
                item.status === "Active"
        ).length;

    const activeReminders =
        activeMedicineCount +
        appointmentCount;

    setText(
        "elderlyCount",
        elderlyCount
    );

    setText(
        "medicineCount",
        medicineCount
    );

    setText(
        "appointmentCount",
        appointmentCount
    );

    setText(
        "reminderCount",
        activeReminders
    );

    setText(
        "reportElderlyCount",
        elderlyCount
    );

    setText(
        "reportMedicineCount",
        medicineCount
    );

    setText(
        "reportAppointmentCount",
        appointmentCount
    );

    setText(
        "reportReminderCount",
        activeReminders
    );

    setText(
        "summaryElderly",
        elderlyCount
    );

    setText(
        "summaryMedicines",
        activeMedicineCount
    );

    setText(
        "summaryAppointments",
        appointmentCount
    );
}


// ============================================
// 41. SET TEXT
// ============================================

function setText(id, value) {
    const element =
        document.getElementById(id);

    if (element) {
        element.textContent =
            value;
    }
}


// ============================================
// 42. FORMAT TIME
// ============================================

function formatTime(time) {
    if (!time) return "-";

    const parts =
        String(time).split(":");

    let hour =
        Number(parts[0]);

    const minute =
        parts[1] || "00";

    if (Number.isNaN(hour)) {
        return String(time);
    }

    const ampm =
        hour >= 12
            ? "PM"
            : "AM";

    hour =
        hour % 12 || 12;

    return (
        String(hour).padStart(2, "0") +
        ":" +
        minute +
        " " +
        ampm
    );
}


// ============================================
// 43. FORMAT DATE
// ============================================

function formatDate(date) {
    if (!date) return "-";

    const d =
        new Date(
            String(date) +
            "T00:00:00"
        );

    if (Number.isNaN(d.getTime())) {
        return String(date);
    }

    return d.toLocaleDateString(
        "en-IN",
        {
            day: "2-digit",
            month: "long",
            year: "numeric"
        }
    );
}


// ============================================
// 44. TIME ICON
// ============================================

function getTimeIcon(type) {
    const icons = {
        Morning: "🌅",
        Afternoon: "☀️",
        Evening: "🌆",
        Night: "🌙",
        Other: "⏰"
    };

    return (
        icons[type] ||
        "⏰"
    );
}


// ============================================
// 45. SECURITY - HTML
// ============================================

function escapeHTML(value) {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}


// ============================================
// 46. SECURITY - ATTRIBUTE
// ============================================

function escapeAttribute(value) {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll('"', "&quot;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;");
}


// ============================================
// 47. SETTINGS
// ============================================

function openSettings() {
    const modal =
        document.getElementById(
            "settingsModal"
        );

    if (modal) {
        modal.classList.add("show");
    }
}

function closeSettings() {
    const modal =
        document.getElementById(
            "settingsModal"
        );

    if (modal) {
        modal.classList.remove("show");
    }
}


// ============================================
// 48. DARK MODE
// ============================================

function toggleDarkMode() {
    const toggle =
        document.getElementById(
            "darkModeToggle"
        );

    if (!toggle) return;

    const enabled =
        toggle.checked;

    document.body.classList.toggle(
        "dark-mode",
        enabled
    );

    localStorage.setItem(
        "darkMode",
        enabled ? "true" : "false"
    );
}


// ============================================
// 49. NOTIFICATIONS
// ============================================

function toggleNotifications() {
    const toggle =
        document.getElementById(
            "notificationToggle"
        );

    if (!toggle) return;

    localStorage.setItem(
        "notifications",
        toggle.checked
            ? "true"
            : "false"
    );
}


// ============================================
// 50. CLEAR ALL DATA
// ============================================

function clearAllData() {
    const confirmDelete =
        confirm(
            "Are you sure you want to delete all project data?"
        );

    if (!confirmDelete) return;

    localStorage.removeItem(
        "elderlyData"
    );

    localStorage.removeItem(
        "medicineData"
    );

    localStorage.removeItem(
        "appointmentData"
    );

    elderlyData = [];
    medicineData = [];
    appointmentData = [];

    renderElderlyData();
    renderMedicines();
    renderAppointments();

    updateAllCounts();

    loadElderlyOptions();
    loadAppointmentOptions();

    alert(
        "All data has been cleared."
    );
}


// ============================================
// 51. LOAD SETTINGS
// ============================================

function loadSettings() {
    const darkMode =
        localStorage.getItem(
            "darkMode"
        );

    const notifications =
        localStorage.getItem(
            "notifications"
        );

    if (darkMode === "true") {
        document.body.classList.add(
            "dark-mode"
        );
    } else {
        document.body.classList.remove(
            "dark-mode"
        );
    }

    const darkModeToggle =
        document.getElementById(
            "darkModeToggle"
        );

    if (darkModeToggle) {
        darkModeToggle.checked =
            darkMode === "true";
    }

    const notificationToggle =
        document.getElementById(
            "notificationToggle"
        );

    if (notificationToggle) {
        notificationToggle.checked =
            notifications === null
                ? true
                : notifications === "true";
    }
}


// ============================================
// 52. CLOSE MODALS OUTSIDE CLICK
// ============================================

window.addEventListener(
    "click",
    function (event) {

        const elderlyModal =
            document.getElementById(
                "elderlyModal"
            );

        const medicineModal =
            document.getElementById(
                "medicineModal"
            );

        const appointmentModal =
            document.getElementById(
                "appointmentModal"
            );

        const settingsModal =
            document.getElementById(
                "settingsModal"
            );

        if (
            event.target ===
            elderlyModal
        ) {
            closeElderlyForm();
        }

        if (
            event.target ===
            medicineModal
        ) {
            closeMedicineForm();
        }

        if (
            event.target ===
            appointmentModal
        ) {
            closeAppointmentForm();
        }

        if (
            event.target ===
            settingsModal
        ) {
            closeSettings();
        }
    }
);


// ============================================
// 53. ESC KEY
// ============================================

document.addEventListener(
    "keydown",
    function (event) {

        if (event.key !== "Escape") {
            return;
        }

        closeElderlyForm();
        closeMedicineForm();
        closeAppointmentForm();
        closeSettings();
    }
);


// ============================================
// 54. SEARCH EVENTS
// ============================================

document.addEventListener(
    "DOMContentLoaded",
    function () {

        const elderlySearch =
            document.getElementById(
                "searchElderly"
            );

        const medicineSearch =
            document.getElementById(
                "searchMedicine"
            );

        const appointmentSearch =
            document.getElementById(
                "searchAppointment"
            );

        if (elderlySearch) {
            elderlySearch.addEventListener(
                "input",
                renderElderlyData
            );
        }

        if (medicineSearch) {
            medicineSearch.addEventListener(
                "input",
                renderMedicines
            );
        }

        if (appointmentSearch) {
            appointmentSearch.addEventListener(
                "input",
                renderAppointments
            );
        }
    }
);


// ============================================
// 55. SAFE JSON LOADER
// ============================================

function loadJSON(key, fallback) {
    try {

        const saved =
            localStorage.getItem(key);

        if (saved === null) {
            return fallback;
        }

        const parsed =
            JSON.parse(saved);

        return parsed;

    } catch (error) {

        console.warn(
            `Could not load ${key} from localStorage.`,
            error
        );

        return fallback;
    }
}


// ============================================
// 56. INITIALIZE APP
// ============================================

document.addEventListener(
    "DOMContentLoaded",
    function () {

        migrateMedicineData();

        renderElderlyData();

        renderMedicines();

        renderAppointments();

        updateAllCounts();

        loadElderlyOptions();

        loadAppointmentOptions();

        loadSettings();
    }
);
