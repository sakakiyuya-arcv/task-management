// Delete task
const buttonsDelete = document.querySelectorAll('[button-delete]');
if(buttonsDelete.length > 0){
    const formDeleteItem = document.querySelector('#form-delete-item');
    const path = formDeleteItem.getAttribute('data-path');
    
    buttonsDelete.forEach(button => {
        button.addEventListener('click', () => {
            if(!confirm('Xác nhận xoá thành viên này?')) return;
            
            const id = button.getAttribute('data-id');
            const action = path + `/${id}?_method=DELETE`;
            formDeleteItem.action = action;
            formDeleteItem.submit();
        });
    });
}