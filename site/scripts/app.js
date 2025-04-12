const prr = (() => {

    let lastTaskNumber = 100;

    const getNextTaskNumber = () => {
        const keys = Object.getOwnPropertyNames(localStorage).map(key => parseInt(key)).sort();
        if (keys.length) {
            lastTaskNumber = Math.max(lastTaskNumber, keys[keys.length - 1]);
        }
        return ++lastTaskNumber;
    }

    const initialTasks = [
        { id: getNextTaskNumber(), subject: 'Walk the dog', status: 'Pending' },
        { id: getNextTaskNumber(), subject: 'Wash the car', status: 'Pending' },
        { id: getNextTaskNumber(), subject: 'Do the dishes', status: 'Pending' },
        { id: getNextTaskNumber(), subject: 'Bake a cake', status: 'Completed' },
        { id: getNextTaskNumber(), subject: 'Laundry', status: 'Pending' },
    ]

    class Task {
        constructor() {
            this.id = ko.observable();
            this.subject = ko.observable();
            this.status = ko.observable();
            this.isHovered = ko.observable(false);
        }
        toJS() {
            return {
                id: this.id(),
                subject: this.subject(),
                status: this.status()
            }
        }
        hovered() {
            this.isHovered(true);
        }
        unhovered() {
            this.isHovered(false);
        }
    }

    let self;

    class TaskManager {
        constructor() {
            self = this;
            this.tasks = ko.observableArray([]);
            this.statuses = ko.observableArray(['All', 'Pending', 'Completed']);
            this.statusChangeOptions = ko.computed(() => {
                return this.statuses().filter(s => s !== 'All');
            })
            this.statusFilter = ko.observable('All');

            this.filteredTasks = ko.computed(() => {
                let filteredArray;
                if (this.statusFilter() == 'All') {
                    filteredArray = this.tasks();
                } else {
                    filteredArray = this.tasks().filter(t => t.status() === self.statusFilter());
                }
                return filteredArray.sort((a,b) => {
                    let aVal = a[self.sortColumn()]();
                    let bVal = b[self.sortColumn()]();

                    if (self.sortColumn() === 'id') {
                        return (parseInt(aVal) - parseInt(bVal)) * (self.sortAscending() ? 1 : -1)
                    }

                    if (aVal.toLowerCase() > bVal.toLowerCase()) {
                        return self.sortAscending() ? 1 : -1;
                    } else {
                        return self.sortAscending() ? -1 : 1;
                    }
                });
            }, self);
            
            this.isEditing = ko.observable(false);
            this.editID = ko.observable();
            this.editSubject = ko.observable();
            this.editStatus = ko.observable();
            this.isEditing.subscribe((val) => {
                if (!val) {
                    this.editID(null);
                    this.editSubject(null);
                    this.editStatus(null);
                }
            });
            this.isFormInvalid = ko.observable(false);
            this.sortAscending = ko.observable(true);
            this.sortColumn = ko.observable('id');

            if (window.localStorage.length) {
                const keys = Object.getOwnPropertyNames(localStorage).map(key => parseInt(key)).sort();
                keys.forEach(key => {
                    const val = JSON.parse(window.localStorage.getItem(key));
                    const task = new Task();
                    task.id(val.id);
                    task.subject(val.subject);
                    task.status(val.status);
                    self.tasks.push(task);
                });
            } else {
                initialTasks.forEach((t) => {
                    const task = new Task();
                    task.id(t.id);
                    task.subject(t.subject);
                    task.status(t.status);
                    self.save(task);
                });
            }
        }

        save(task) {
            this.isFormInvalid(typeof(task.subject()) === 'undefined');
            if (this.isFormInvalid()) {
                this.isEditing(true);
                return;
            }
            if (!task.id()) {
                task.id(getNextTaskNumber());
            }
            this.tasks.push(task);
            const json = JSON.stringify(task.toJS());
            window.localStorage.setItem(task.id(), json);
            this.isEditing(false);
        }

        add() {
            this.edit(new Task());
        }

        edit(task) {
            self.isEditing(true);
            self.editID(task.id());
            self.editSubject(task.subject());
            self.editStatus(task.status());
        }

        cancelEdit() {
            self.isEditing(false);
            this.isFormInvalid(false);
        }

        submitEdit() {
            this.tasks.remove((item) => item.id() === self.editID());
            const editedTask = new Task();
            editedTask.id(this.editID());
            editedTask.subject(this.editSubject());
            editedTask.status(this.editStatus());
            self.save(editedTask);
        }

        deleteTask(task) {
            self.tasks.remove((item) => item.id() === task.id());
            window.localStorage.removeItem(task.id());
        }

        sort(col) {
            if (self.sortColumn() === col) {
                self.sortAscending(!self.sortAscending());
            }
            else {
                self.sortColumn(col);
                self.sortAscending(true);
            }
        }
    }

    return {
        Task,
        TaskManager
    }
})();