document.addEventListener('DOMContentLoaded', function() {
    // Task status cycle: todo → in-progress → done → todo
    const buttonsChangeStatus = document.querySelectorAll('[button-change-status]');
    if(buttonsChangeStatus.length > 0){
        const formChangeStatus = document.querySelector('#form-change-status');
        const path = formChangeStatus.getAttribute('data-path');

        buttonsChangeStatus.forEach(button => {
            button.addEventListener('click', () => {
                const statusCurrent = button.getAttribute('data-status');  
                const id = button.getAttribute('data-id');

                // let statusChange = statusCurrent === 'in-progress' ? 'completed' : (statusCurrent === 'completed' ? 'on-hold' : 'in-progress');
                let statusChange = statusCurrent === 'in-progress' ? 'on-hold' : (statusCurrent === 'on-hold' ? 'in-progress' : 'completed');

                const action = path + `/${statusChange}/${id}?_method=PATCH`;
                formChangeStatus.action = action;
                formChangeStatus.submit();
            });
        });
    }

    // Delete project
    const buttonsDelete = document.querySelectorAll('[button-delete]');
    if(buttonsDelete.length > 0){
        const formDeleteItem = document.querySelector('#form-delete-item');
        const path = formDeleteItem.getAttribute('data-path');
        
        buttonsDelete.forEach(button => {
            button.addEventListener('click', () => {
                if(!confirm('Xác nhận xoá dự án này?')) return;
                
                const id = button.getAttribute('data-id');
                const action = path + `/${id}?_method=DELETE`;
                formDeleteItem.action = action;
                formDeleteItem.submit();
            });
        });
    }

    // Clickable rows
    const clickableRows = document.querySelectorAll("tbody tr.clickable-row");

    clickableRows.forEach(row => {
        row.addEventListener("click", (event) => {
            const target = event.target;

            if (
                target.tagName === "A" ||
                target.tagName === "BUTTON" ||
                target.tagName === "INPUT"
            ) {
                return;
            }
            
            const href = row.dataset.href;
            if (href) {
                window.location.href = href;
            }
        });
    });
});