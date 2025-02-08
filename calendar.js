(function () {
    class Calendar {
        constructor(options = {}) {
            // Get the input element from options.inputElement or options.inputId
            this.inputField = options.inputElement || document.getElementById(options.inputId);
            this.inputField.setAttribute('readonly', true);
            this.inputField.addEventListener("click", this.initDatapicker.bind(this));

            this.config = this.getConfig();
            this.currentDate = new Date();
        }

        /**
         * Initializes the date picker.
         */
        initDatapicker() {
            this.selectedDate = this.inputField.value
                ? this.parseDate(this.inputField.value, this.config.format) || new Date()
                : new Date();

            this.currentView = "day";

            this.createDialog();
            this.attachEventListeners();
            this.showCalendar();
        }

        /**
         * Retrieves the configuration options for the calendar.
         * @returns {Object} The configuration options.
         */
        getConfig() {
            const options = this.inputField.getAttribute('data-options') ? JSON.parse(this.inputField.getAttribute('data-options')) : {};

            return {
                theme_class: options.mode == 'dark' ? 'dark-mode' : 'light-mode',
                format: options.format || "dd-MM-yyyy",
                time: !!options.time,
                second: !!options.second,
                width: parseInt(options.width, 10) || 250,
                save_text: options.save_label || "Set",
                cancel_text: options.cancel_label || "Cancel"
            }
        }

        /**
         * Creates the calendar dialog.
         */
        createDialog() {
            if (document.querySelector(".calendar-dialog")) {
                document.querySelector(".calendar-dialog").remove();
            }

            this.calendarDialog = document.createElement("div");
            this.calendarDialog.classList.add(this.config.theme_class, "calendar-dialog");
            this.calendarDialog.style.width = `${this.config.width}px`;

            this.renderHeader();
            this.renderBody();
            this.renderFooter();
            if (this.config.time) {
                // this.getTimePickerHTML();
            }

            document.body.appendChild(this.calendarDialog);
        }

        /**
         * Renders the header of the calendar.
         */
        renderHeader() {
            const header = document.createElement("div");
            header.className = "calendar-header";

            const headerLeft = document.createElement("div");
            headerLeft.className = "header-left";

            const monthContainer = document.createElement("div");
            monthContainer.className = "month-container";
            monthContainer.innerHTML = `
                <span id="monthYear" class="month-display"></span>
            `;

            const headerRight = document.createElement("span");
            headerRight.className = "header-right";

            headerRight.innerHTML = `
                <span id="prevYear" class="nav-icon" aria-label="Previous">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/>
                    </svg>
                </span>
                <span id="nextYear" class="nav-icon" aria-label="Next">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M8.59 16.59L10 18l6-6-6-6-1.41 1.41L13.17 12z"/>
                    </svg>
                </span>
            `;

            headerLeft.appendChild(monthContainer);
            header.appendChild(headerLeft);
            header.appendChild(headerRight);
            this.calendarDialog.appendChild(header);
        }

        /**
         * Renders the body of the calendar.
         */
        renderBody() {
            const body = document.createElement("div");
            body.className = "calendar-body";
            this.calendarDialog.appendChild(body);
            this.render();
        }

        /**
         * Renders the calendar based on the current view (day, month, year).
         * @param {string} [animationName] - The name of the animation to apply.
         */
        render(animationName) {
            const grid = document.createElement("div");
            grid.className = "calendar-grid";
            grid.innerHTML = '';

            const monthDisplay = this.calendarDialog.querySelector("#monthYear");

            if (this.currentView === 'day') {
                this.renderDayView(grid, monthDisplay, animationName);
            } else if (this.currentView === 'month') {
                this.renderMonthView(grid, monthDisplay);
            } else if (this.currentView === 'year') {
                this.renderYearView(grid, monthDisplay);
            }

            this.calendarDialog.querySelector(".calendar-body").innerHTML = "";
            this.calendarDialog.querySelector(".calendar-body").appendChild(grid);

            if (animationName) {
                this.applyAnimation(animationName);
            }
        }

        /**
         * Renders the day view of the calendar.
         * @param {HTMLElement} grid - The grid element to render the days into.
         * @param {HTMLElement} monthDisplay - The element to display the current month and year.
         * @param {string} [animationName] - The name of the animation to apply.
         */
        renderDayView(grid, monthDisplay, animationName) {
            const options = { year: 'numeric', month: 'long' };
            monthDisplay.textContent = this.selectedDate.toLocaleString("default", options);

            grid.classList.add("calendar-grid-one");
            const daysLabelContainer = this.createDaysLabelContainer();
            const daysContainer = this.createDaysContainer();

            const firstDayIndex = new Date(this.selectedDate.getFullYear(), this.selectedDate.getMonth(), 1).getDay();
            const daysInMonth = new Date(this.selectedDate.getFullYear(), this.selectedDate.getMonth() + 1, 0).getDate();
            const previousMonth = new Date(this.selectedDate.getFullYear(), this.selectedDate.getMonth() - 1, 1);
            const nextMonth = new Date(this.selectedDate.getFullYear(), this.selectedDate.getMonth() + 1, 1);

            this.addPreviousMonthDays(daysContainer, firstDayIndex, previousMonth);
            this.addCurrentMonthDays(daysContainer, daysInMonth);
            this.ensureSixRows(daysContainer, firstDayIndex, daysInMonth, nextMonth);

            grid.appendChild(daysLabelContainer);
            grid.appendChild(daysContainer);
        }

        /**
         * Renders the month view of the calendar.
         * @param {HTMLElement} grid - The grid element to render the months into.
         * @param {HTMLElement} monthDisplay - The element to display the current year.
         */
        renderMonthView(grid, monthDisplay) {
            grid.classList.add("calendar-grid-animation", "calendar-grid-three");
            monthDisplay.textContent = this.selectedDate.getFullYear();

            const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
            monthNames.forEach((m, index) => {
                const cell = this.createCell(index, m, 'day-cell month-cell');
                if (index === this.selectedDate.getMonth()) {
                    cell.classList.add("selected");
                }
                grid.appendChild(cell);
            });
        }

        /**
         * Renders the year view of the calendar.
         * @param {HTMLElement} grid - The grid element to render the years into.
         * @param {HTMLElement} monthDisplay - The element to display the year range.
         */
        renderYearView(grid, monthDisplay) {
            grid.classList.add("calendar-grid-animation", "calendar-grid-three");

            const currentYear = this.selectedDate.getFullYear();
            const startYear = currentYear - 4;
            const endYear = startYear + 12;

            monthDisplay.textContent = `${startYear} - ${endYear - 1}`;
            for (let i = startYear; i < endYear; i++) {
                const yearCell = this.createCell(i, i, 'year-cell');
                if (i === currentYear) {
                    yearCell.classList.add("selected");
                }
                grid.appendChild(yearCell);
            }
        }

        /**
         * Creates the days label container.
         * @returns {HTMLElement} The days label container element.
         */
        createDaysLabelContainer() {
            const daysLabelContainer = document.createElement("div");
            daysLabelContainer.classList.add("calendar-grid", "calendar-grid-days-container");

            const days = ["S", "M", "T", "W", "T", "F", "S"];
            days.forEach(day => {
                const label = document.createElement("div");
                label.classList.add("day-label");
                label.textContent = day;
                daysLabelContainer.appendChild(label);
            });

            return daysLabelContainer;
        }

        /**
         * Creates the days container.
         * @returns {HTMLElement} The days container element.
         */
        createDaysContainer() {
            const daysContainer = document.createElement("div");
            daysContainer.classList.add("calendar-grid", "calendar-grid-animation", "calendar-grid-days-container");
            return daysContainer;
        }

        /**
         * Adds the previous month's days to the days container.
         * @param {HTMLElement} daysContainer - The days container element.
         * @param {number} firstDayIndex - The index of the first day of the current month.
         * @param {Date} previousMonth - The previous month date object.
         */
        addPreviousMonthDays(daysContainer, firstDayIndex, previousMonth) {
            const prevMonthDays = new Date(this.selectedDate.getFullYear(), this.selectedDate.getMonth(), 0).getDate();
            for (let i = firstDayIndex - 1; i >= 0; i--) {
                const previousMonthDate = prevMonthDays - i;
                const cell = this.createCell(previousMonthDate, previousMonthDate, 'day-cell prev-month');
                cell.setAttribute('data-previous-month', previousMonth.getMonth());

                if (previousMonthDate === this.currentDate.getDate() && previousMonth.getMonth() === this.currentDate.getMonth() && previousMonth.getFullYear() === this.currentDate.getFullYear()) {
                    cell.classList.add("current-date");
                }

                daysContainer.appendChild(cell);
            }
        }

        /**
         * Adds the current month's days to the days container.
         * @param {HTMLElement} daysContainer - The days container element.
         * @param {number} daysInMonth - The number of days in the current month.
         */
        addCurrentMonthDays(daysContainer, daysInMonth) {
            for (let day = 1; day <= daysInMonth; day++) {
                const cell = this.createCell(day, day, 'day-cell');

                if (day === this.selectedDate.getDate()) {
                    cell.classList.add("selected");
                }

                if (day === this.currentDate.getDate() && this.currentDate.getMonth() === this.selectedDate.getMonth() && this.currentDate.getFullYear() === this.selectedDate.getFullYear()) {
                    cell.classList.add("current-date");
                }
                daysContainer.appendChild(cell);
            }
        }

        /**
         * Ensures that the days container has 6 rows of day cells.
         * @param {HTMLElement} daysContainer - The days container element.
         * @param {number} firstDayIndex - The index of the first day of the current month.
         * @param {number} daysInMonth - The number of days in the current month.
         * @param {Date} nextMonth - The next month date object.
         */
        ensureSixRows(daysContainer, firstDayIndex, daysInMonth, nextMonth) {
            const totalCells = firstDayIndex + daysInMonth;
            const extraCells = (6 * 7) - totalCells;
            for (let i = 1; i <= extraCells; i++) {
                const cell = this.createCell(i, i, 'day-cell next-month');
                cell.setAttribute('data-next-month', nextMonth.getMonth());

                if (i === this.currentDate.getDate() && nextMonth.getMonth() === this.currentDate.getMonth() && nextMonth.getFullYear() === this.currentDate.getFullYear()) {
                    cell.classList.add("current-date");
                }
                daysContainer.appendChild(cell);
            }
        }

        /**
         * Applies the specified animation to the day cells.
         * @param {string} animationName - The name of the animation to apply.
         */
        applyAnimation(animationName) {
            const dayCells = this.calendarDialog.querySelectorAll(`.calendar-grid-animation`);
            dayCells.forEach(cell => {
                cell.classList.add(animationName);
            });

            setTimeout(() => {
                dayCells.forEach(cell => {
                    cell.classList.remove(animationName);
                });
            }, 500); // Match the duration of the animation (500ms)
        }

        /**
         * Creates a calendar cell.
         * @param {number} value - The value of the cell.
         * @param {string} label - The label of the cell.
         * @param {string} cellClass - The class of the cell.
         * @returns {HTMLElement} The created cell element.
         */
        createCell(value, label, cellClass) {
            const cell = document.createElement('div');
            cell.className = cellClass;
            cell.setAttribute('data-value', value);

            const cellText = document.createElement('span');
            cellText.className = 'cell-text';
            cellText.textContent = label;
            cell.appendChild(cellText);
            return cell;
        }

        /**
         * Attaches event listeners to the calendar elements.
         */
        attachEventListeners() {
            this.calendarDialog.querySelector("#prevYear").addEventListener("click", this.navigatePrev.bind(this));
            this.calendarDialog.querySelector("#nextYear").addEventListener("click", this.navigateNext.bind(this));
            this.calendarDialog.querySelector("#calendar-cancel").addEventListener("click", this.destroy.bind(this));
            this.calendarDialog.querySelector("#calendar-save").addEventListener("click", this.selectedCell.bind(this));
            this.calendarDialog.querySelector("#monthYear").addEventListener("click", this.changeView.bind(this));
            this.calendarDialog.addEventListener("click", this.handleCell.bind(this));
            document.addEventListener("click", this.outsideClickHandler = (e) => {
                if (!this.calendarDialog.contains(e.target) && e.target !== this.inputField) {
                    this.destroy();
                }
            });
        }

        /**
         * Navigates to the previous period (month, year, or range of years).
         */
        navigatePrev() {
            if (this.currentView === "day") {
                this.selectedDate.setMonth(this.selectedDate.getMonth() - 1);
            } else if (this.currentView === "month") {
                this.selectedDate.setFullYear(this.selectedDate.getFullYear() - 1);
            } else if (this.currentView === "year") {
                this.selectedDate.setFullYear(this.selectedDate.getFullYear() - 12);
            }
            this.render('slide-left');
        }

        /**
         * Navigates to the next period (month, year, or range of years).
         */
        navigateNext() {
            if (this.currentView === "day") {
                this.selectedDate.setMonth(this.selectedDate.getMonth() + 1);
            } else if (this.currentView === "month") {
                this.selectedDate.setFullYear(this.selectedDate.getFullYear() + 1);
            } else if (this.currentView === "year") {
                this.selectedDate.setFullYear(this.selectedDate.getFullYear() + 12);
            }

            this.render('slide-right');
        }

        /**
         * Changes the current view of the calendar (day, month, year).
         */
        changeView() {
            if (this.currentView === 'day') {
                this.currentView = 'month';
            } else if (this.currentView === 'month') {
                this.currentView = 'year';
            } else if (this.currentView === 'year') {
                this.currentView = 'month';
            }
            this.render();
        }

        /**
         * Displays the calendar dialog.
         * @param {Event} event - The event object.
         */
        showCalendar(event) {
            this.calendarDialog.style.display = "block";
            this.calendarDialog.classList.add("open");
            const rect = this.inputField.getBoundingClientRect();
            this.calendarDialog.style.top = `${rect.bottom + window.scrollY + 1}px`;
            this.calendarDialog.style.left = `${rect.left + window.scrollX}px`;
        }

        /**
         * Removes the dialog from the DOM and cleans up event listeners.
         */
        destroy() {
            if (this.calendarDialog && this.calendarDialog.parentNode) {
                this.calendarDialog.parentNode.removeChild(this.calendarDialog);
            }
            document.removeEventListener("click", this.outsideClickHandler);
        }

        /**
         * Handles the click event on calendar cells.
         * @param {Event} event - The event object.
         */
        handleCell(event) {
            event.stopPropagation();
            this.inputField.focus();
            
            const target = event.target.closest('[data-value]');
            if (!target) {
                return;
            }

            const selectedValue = parseInt(target.getAttribute('data-value'), 10);

            if (target.classList.contains("month-cell")) {
                this.selectedDate.setMonth(selectedValue);  // store selected month
                this.currentView = 'day';
                this.render();
            } else if (target.classList.contains("year-cell")) {
                this.selectedDate.setFullYear(selectedValue);  // store selected month
                this.currentView = 'month';
                this.render();
            } else if (target.classList.contains("day-cell")) {
                const nextMonth = target.getAttribute('data-next-month');
                const previousMonth = target.getAttribute('data-previous-month');
                this.selectedDate.setDate(selectedValue);

                if (previousMonth) {
                    this.selectedDate.setMonth(previousMonth);
                    this.render('slide-left');
                } else if (nextMonth) {
                    this.selectedDate.setMonth(nextMonth);
                    this.render('slide-right');
                } else {
                    const selected = this.calendarDialog.querySelectorAll('.day-cell.selected');
                    selected.forEach(cell => {
                        cell.classList.remove('selected');
                    });

                    target.classList.add('selected');
                }
            }
        }

        /**
         * Sets the selected date and updates the input field.
         */
        selectedCell() {
            const formatted = this.formatDate(this.selectedDate, this.config.format);
            this.inputField.value = formatted;

            this.destroy();
        }

        /**
         * Renders the footer of the calendar.
         */
        renderFooter() {
            const footer = document.createElement("div");
            footer.className = 'calendar-footer';
            footer.innerHTML = `
                <span id="calendar-cancel" class="button">${this.config.cancel_text}</span>
                <span id="calendar-save" class="button">${this.config.save_text}</span>
            `;

            this.calendarDialog.appendChild(footer)
        }

        /**
         * Generates the HTML for the time picker.
         */
        getTimePickerHTML() {
            const footer = document.createElement("div");
            footer.className = 'time-picker';
            footer.innerHTML = `
                 <select id="hours">${this.generateOptions(0, 23)}</select> :
                 <select id="minutes">${this.generateOptions(0, 59)}</select>
                ${this.config.second ? `: <select id="seconds">${this.generateOptions(0, 59)}</select>` : ""}
            `;

            this.calendarDialog.appendChild(footer)
        }

        /**
         * Generates options for a select element.
         * @param {number} start - The start value.
         * @param {number} end - The end value.
         * @returns {string} The generated options HTML.
         */
        generateOptions(start, end) {
            let options = "";
            for (let i = start; i <= end; i++) {
                const num = String(i).padStart(2, "0");
                options += `<option value="${num}">${num}</option>`;
            }
            return options;
        }

        /**
         * Parses a date string according to the provided format.
         * @param {string} str - The date string.
         * @param {string} format - The format string.
         * @returns {Date|null} The parsed date or null if parsing fails.
         */
        parseDate(str, format) {
            try {
                const formatParts = format.split(/[^A-Za-z]+/);
                const dateParts = str.split(/[^0-9]+/);
                let day, month, year, hours = 0, minutes = 0, seconds = 0;
                formatParts.forEach((token, i) => {
                    const value = parseInt(dateParts[i], 10);
                    if (token === "dd") day = value;
                    else if (token === "MM") month = value - 1;
                    else if (token === "yyyy") year = value;
                    else if (token === "HH") hours = value;
                    else if (token === "mm") minutes = value;
                    else if (token === "ss") seconds = value;
                });
                return new Date(year, month, day, hours, minutes, seconds);
            } catch (e) {
                return null;
            }
        }

        /**
         * Formats a date according to the provided format.
         * @param {Date} date - The date to format.
         * @param {string} format - The format string.
         * @returns {string} The formatted date string.
         */
        formatDate(date, format) {
            const map = {
                dd: String(date.getDate()).padStart(2, "0"),
                MM: String(date.getMonth() + 1).padStart(2, "0"),
                yyyy: date.getFullYear(),
                HH: String(date.getHours()).padStart(2, "0"),
                mm: String(date.getMinutes()).padStart(2, "0"),
                ss: String(date.getSeconds()).padStart(2, "0"),
                S: date.getMilliseconds()
            };

            return format.replace(/dd|MM|yyyy|HH|mm|ss|S/g, matched => map[matched]);
        }
    }

    window.Calendar = Calendar;
})();
