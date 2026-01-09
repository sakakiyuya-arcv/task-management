const buttonStatus = document.querySelectorAll("[button-status]")
// console.log(buttonStatus);
if(buttonStatus.length > 0){
    let url = new URL(window.location.href)

    buttonStatus.forEach(button => {
        button.addEventListener("click",() =>{
            const status = button.getAttribute("button-status")
            
            if(status){
                url.searchParams.set("status",status)
            }else{
                url.searchParams.delete("status")
            }
            window.location.href = url.href;
        })
    })
}

const buttonBack = document.querySelectorAll("[button-back]")
if(buttonBack.length > 0){
    buttonBack.forEach(button => {
        button.addEventListener("click",() =>{
            window.history.back();
        })
    })
}

const formSearch = document.querySelector("#form-search")
if(formSearch){
    let url = new URL(window.location.href)
    formSearch.addEventListener("submit",(e) => {
        e.preventDefault();
        const keyword = e.target.elements.keyword.value;

        if(keyword){
            url.searchParams.set("keyword",keyword)
        }else{
            url.searchParams.delete("keyword")
        }
        window.location.href = url.href;
    })
}

const buttonPagination = document.querySelectorAll("[button-pagination]")
if(buttonPagination.length){
    let url = new URL(window.location.href)
    buttonPagination.forEach(button => {
        button.addEventListener("click",() => {
            const page = button.getAttribute("button-pagination")
            if(page){
                url.searchParams.set("page",page)
            }else{
                url.searchParams.delete("page")
            }
            window.location.href = url.href;
        })
    })
}

const checkboxMulti = document.querySelector('[checkbox-multi]');
if (checkboxMulti) {
    const checkAll = checkboxMulti.querySelector('input[name="checkall"]');
    const checkboxes = checkboxMulti.querySelectorAll('input[name="id"]');
    
    if (checkAll) {
        checkAll.addEventListener('change', () => {
            checkboxes.forEach(checkbox => checkbox.checked = checkAll.checked);
        });
    }

    checkboxes.forEach(checkbox => {
        checkbox.addEventListener('change', () => {
            const allChecked = Array.from(checkboxes).every(cb => cb.checked);
            if (checkAll) checkAll.checked = allChecked;
        });
    });
} 

const formChangeMulti = document.querySelector("[form-change-multi]");
if (formChangeMulti) {
    formChangeMulti.addEventListener("submit", (e) => {
        e.preventDefault();

        const checkboxMulti = document.querySelector("[checkbox-multi]");
        if (!checkboxMulti) {
             alert("Lỗi cấu hình: Không tìm thấy bảng checkbox.");
             return;
        }

        const inputsChecked = checkboxMulti.querySelectorAll("input[name='id']:checked");
        const typeChange = e.target.elements.type.value;

        if (typeChange === "delete-all") {
            const confirmDelete = confirm("Bạn có chắc chắn muốn xóa các mục đã chọn không?");
            if (!confirmDelete) {
                return;
            }
        }

        if (inputsChecked.length > 0) {
            let ids = [];
            const inputIds = formChangeMulti.querySelector("input[name='ids']");
            if (!inputIds) {
                alert("Lỗi cấu hình: Không tìm thấy input ẩn 'ids'.");
                return;
            }
            inputsChecked.forEach((input) => {
                ids.push(input.value);
            });
            inputIds.value = ids.join(", ");
            formChangeMulti.submit();

        } else {
            alert("Vui lòng chọn ít nhất một mục.");
            return;
        }
    });
} 

const showAlert = document.querySelector("[show-alert]");
if(showAlert){
    const time = parseInt(showAlert.getAttribute("data-time")); 
    const closeAlert = showAlert.querySelector("[close-alert]");       
    setTimeout(() => {
        showAlert.classList.add("alert-hidden");
    }, time);
    
    closeAlert.addEventListener("click", () => {
        showAlert.classList.add("alert-hidden");
    });
}

$(document).ready(function() {
    $('.select2').select2({
        placeholder: "Chọn thành viên hỗ trợ",
        allowClear: true,
        width: '100%',
        dropdownAutoWidth: true,
        dropdownPosition: 'below'
    });
});