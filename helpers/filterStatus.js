module.exports.taskFilter = (query) => {
    let filterStatus = [
        {
            name: "__",
            status: "",
            class: "",
            btclass: "btn-outline-info"
        },
        {
            name: "Todo",
            status: "todo",
            class: "",
            btclass: "btn-outline-secondary"
        },
        {
            name: "Đang làm",
            status: "in-progress",
            class: "",
            btclass: "btn-outline-primary"
        },
        {
            name: "Hoàn thành",
            status: "done",
            class: "",
            btclass: "btn-outline-success"
        },
        {
            name: "Quá hạn",
            status: "overdue",
            class: "",
            btclass: "btn-outline-danger"
        },
        {
            name: "Tất cả",
            status: "all",
            class: "",
            btclass: "btn-violet"
        }
    ];

    if(query.status){
        const index = filterStatus.findIndex(item => item.status == query.status)
        filterStatus[index].class = "active";
    }else{
        const index = filterStatus.findIndex(item => item.status == "" )
        filterStatus[index].class = "active";
    }
    return filterStatus
}

module.exports.projectFilter = (query) => {
    let filterStatus = [
        {
            name: "Đang làm",
            status: "in-progress",
            class: "",
            btclass: "btn-outline-primary"
        },
        {
            name: "Tạm dừng",
            status: "on-hold",
            class: "",
            btclass: "btn-outline-warning"
        },
        {
            name: "Hoàn thành",
            status: "completed",
            class: "",
            btclass: "btn-outline-success"
        },
        {
            name: "Quá hạn",
            status: "overdue",
            class: "",
            btclass: "btn-outline-danger"
        },
        {
            name: "Tất cả",
            status: "all",
            class: "",
            btclass: "btn-violet"
        }
    ];

    if(query.status){
        const index = filterStatus.findIndex(item => item.status == query.status)
        filterStatus[index].class = "active";
    }else{
        const index = filterStatus.findIndex(item => item.status == "in-progress")
        filterStatus[index].class = "active";
    }
    return filterStatus
}