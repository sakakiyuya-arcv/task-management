// Validate password match
const form = document.querySelector("form");
form.addEventListener("submit", (e) => {
    const newPassword = document.querySelector("#newPassword").value;
    const confirmPassword = document.querySelector("#confirmPassword").value;
    
    if(newPassword !== confirmPassword){
        e.preventDefault();
        alert("Mật khẩu xác nhận không khớp!");
        return false;
    }
});

// Preview avatar
const inputAvatar = document.querySelector("#avatar");
const previewAvatar = document.querySelector("#preview-avatar");

if(inputAvatar){
    inputAvatar.addEventListener("change", (e) => {
        const file = e.target.files[0];
        if(file){
            const reader = new FileReader();
            reader.onload = (event) => {
                if(previewAvatar.tagName === "IMG"){
                    previewAvatar.src = event.target.result;
                } else {
                    const img = document.createElement("img");
                    img.src = event.target.result;
                    img.className = "rounded-circle mb-3";
                    img.width = 150;
                    img.height = 150;
                    img.id = "preview-avatar";
                    previewAvatar.parentNode.replaceChild(img, previewAvatar);
                }
            };
            reader.readAsDataURL(file);
        }
    });
}
