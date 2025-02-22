function toggleDropdown() {
            document.getElementById("dropdown-content").classList.toggle("show");
        }

        // Fechar o dropdown se o usuário clicar fora dele
        window.onclick = function(event) {
            if (!event.target.matches('.drop_down')) {
                var dropdowns = document.getElementsByClassName("dropdown_content");
                for (var i = 0; i < dropdowns.length; i++) {
                    var openDropdown = dropdowns[i];
                    if (openDropdown.classList.contains('show')) {
                        openDropdown.classList.remove('show');
                    }
                }
            }
        }