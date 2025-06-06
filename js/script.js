document.addEventListener('DOMContentLoaded', function() {
    // 导航切换
    const navItems = document.querySelectorAll('.nav-item');
    const pages = document.querySelectorAll('.page');

    navItems.forEach(item => {
        item.addEventListener('click', function() {
            const targetPage = this.getAttribute('data-page');
            
            // 更新导航状态
            navItems.forEach(nav => nav.classList.remove('active'));
            this.classList.add('active');
            
            // 更新页面显示
            pages.forEach(page => {
                page.classList.remove('active');
                if (page.id === `${targetPage}-page`) {
                    page.classList.add('active');
                }
            });
        });
    });

    // 添加新菜按钮点击事件
    const addDishBtn = document.getElementById('add-dish');
    if (addDishBtn) {
        addDishBtn.addEventListener('click', function() {
            // TODO: 实现添加新菜的功能
            alert('添加新菜功能即将上线');
        });
    }

    // 批量管理按钮点击事件
    const batchManageBtn = document.getElementById('batch-manage');
    if (batchManageBtn) {
        batchManageBtn.addEventListener('click', function() {
            // TODO: 实现批量管理功能
            alert('批量管理功能即将上线');
        });
    }

    // 编辑按钮点击事件
    const editButtons = document.querySelectorAll('.edit-btn');
    editButtons.forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            // TODO: 实现编辑功能
            alert('编辑功能即将上线');
        });
    });
}); 