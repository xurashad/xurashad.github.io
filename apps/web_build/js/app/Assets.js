export function setupAssets(App) {
    Object.assign(App.prototype, {
        handleBgUpload(e) {
            const file = e.target.files[0];
            if (!file || !this.selEl) return;
            const reader = new FileReader();
            reader.onload = (ev) => {
                const id = 'asset_' + Date.now();
                this.siteData.assets[id] = { name: file.name.replace(/[^a-zA-Z0-9.]/g,'_'), url: ev.target.result, type: file.type, base64: ev.target.result.split(',')[1] };
                this.selEl.style.backgroundImage = `url('${ev.target.result}')`;
                this.selEl.style.backgroundSize = 'cover';
                this.selEl.style.backgroundPosition = 'center';
                this.selEl.setAttribute('data-bg-asset', id);
                this.renderAssets();
                this.savePage();
                this.saveHistory();
                this.toast('Background set!', 'success');
            };
            reader.readAsDataURL(file);
            e.target.value = '';
        },

        handleAssetUpload(e) {
            const files = Array.from(e.target.files);
            let loaded = 0;
            files.forEach(file => {
                const reader = new FileReader();
                reader.onload = (ev) => {
                    const id = 'asset_' + Date.now() + '_' + Math.random().toString(36).substr(2,6);
                    this.siteData.assets[id] = { name: file.name.replace(/[^a-zA-Z0-9.]/g,'_'), url: ev.target.result, type: file.type, base64: ev.target.result.split(',')[1] };
                    loaded++;
                    if (loaded === files.length) {
                        this.renderAssets();
                        this.saveHistory();
                        this.toast(`${files.length} file(s) uploaded!`, 'success');
                    }
                };
                reader.readAsDataURL(file);
            });
            e.target.value = '';
        },

        renderAssets() {
            const count = Object.keys(this.siteData.assets).length;
            this.dom.assetEmpty.style.display = count === 0 ? 'block' : 'none';
            this.dom.assetGrid.innerHTML = '';
            for (let id in this.siteData.assets) {
                const asset = this.siteData.assets[id];
                const div = document.createElement('div');
                div.className = 'asset-item';
                div.setAttribute('draggable','true');
                div.ondragstart = (e) => e.dataTransfer.setData('text/plain', `asset:${id}`);
                div.ondblclick = () => this.insertAsset(id);
                div.title = asset.name + '\nDouble-click to insert';
                if (asset.type.startsWith('image')) {
                    div.innerHTML = `<img src="${asset.url}" alt="${asset.name}">`;
                } else if (asset.type.startsWith('video')) {
                    div.innerHTML = `<i class="fas fa-film"></i>`;
                } else {
                    div.innerHTML = `<i class="fas fa-file-alt"></i>`;
                }
                const delBtn = document.createElement('i');
                delBtn.className = 'fas fa-times';
                delBtn.style.cssText = 'position:absolute;top:2px;right:2px;font-size:9px;color:#f05b5b;cursor:pointer;display:none;';
                div.style.position = 'relative';
                div.appendChild(delBtn);
                div.onmouseenter = () => delBtn.style.display = 'block';
                div.onmouseleave = () => delBtn.style.display = 'none';
                delBtn.onclick = (e) => { e.stopPropagation(); delete this.siteData.assets[id]; this.renderAssets(); };
                div.innerHTML += `<span>${asset.name}</span>`;
                this.dom.assetGrid.appendChild(div);
            }
        },

        insertAsset(id) {
            const asset = this.siteData.assets[id];
            if (!asset) return;
            const target = this.getTargetColumn();
            if (!target) { this.toast('Select a column first!', 'warning'); return; }
            let el;
            if (asset.type.startsWith('image')) {
                el = document.createElement('img');
                el.src = asset.url; el.className = 'b-el';
                el.style.width = '100%'; el.style.borderRadius = '8px';
                el.setAttribute('data-asset', id); el.setAttribute('data-label','Image');
            } else if (asset.type.startsWith('video')) {
                el = document.createElement('div');
                el.className = 'b-el video-wrapper';
                el.setAttribute('data-asset', id); el.setAttribute('data-label','Video');
                el.innerHTML = `<video src="${asset.url}" controls style="position:absolute;top:0;left:0;width:100%;height:100%;"></video>`;
            }
            if (el) {
                target.appendChild(el);
                this.bindElementEvents();
                this.selectEl(el);
                this.savePage();
                this.saveHistory();
                this.toast('Asset inserted!', 'success', 1200);
            }
        }
    });
}