var Writer = function (note, elem) {
    this.note = note;
    this.elem = elem;
    this.noteOpener = new NoteOpener(note);
    this.seriesTaskExecutor = new SeriesTaskExecutor();
    this.saveNoteTask = new SaveNoteTask(this)

}


Writer.prototype.extractNote = function () {
    var writer = this;
    console.log("extractNote")
    writer.noteOpener.extractTo("tmp/", function (noSuchFile) {
        console.log("done")
        if (!noSuchFile) {
            var fs = require('fs');
            fs.readFile('tmp/index.html', function read(err, data) {
                if (err) {
                    throw err;
                }

                content = data;
                console.log(data)
                writer.fillWriter(content)
            });
        }
        else {
            writer.fillWriter(undefined)
        }
        /*fs.readFile('tmp/metadata.json', function read(err, data) {
            if (err) {
                throw err;
            }
            
            content = data;
            console.log(data)
            this.note.metadata = JSON.parse(content)
        });*/
        //copying reader.html
    })
}

Writer.prototype.fillWriter = function (extractedHTML) {
    if (extractedHTML != undefined)
        this.oEditor.innerHTML = extractedHTML;
    this.oDoc = document.getElementById("text");
    this.oFloating = document.getElementById("floating");
    var writer = this
    this.oDoc.addEventListener("input", function () {
        writer.seriesTaskExecutor.addTask(writer.saveNoteTask.saveTxt)
    }, false);
    this.sDefTxt = this.oDoc.innerHTML;
    /*simple initialization*/
    this.oDoc.focus();
    resetScreenHeight();
    this.refreshKeywords();
    //  $("#editor").webkitimageresize().webkittableresize().webkittdresize();

}

Writer.prototype.refreshKeywords = function(){
    var keywordsContainer = document.getElementById("keywords-list");
    keywordsContainer.innerHTML = "";
    for (let word of this.note.metadata.keywords) {
        var keywordElem = document.createElement("a")
        keywordElem.classList.add("mdl-navigation__link");
        keywordElem.innerHTML = word;
        keywordsContainer.appendChild(keywordElem);
        
    }
}

Writer.prototype.formatDoc = function (sCmd, sValue) {
    this.oEditor.focus();
    if (validateMode()) { document.execCommand(sCmd, false, sValue); this.oEditor.focus(); }
}

Writer.prototype.displayTextColorPicker = function () {
    var writer = this;
    this.displayColorPicker(function () {
        writer.setColor(writer.colorPicker.getHexString())
    });
}

Writer.prototype.displayFillColorPicker = function () {
    var writer = this;
    this.displayColorPicker(function () {
        writer.fillColor(writer.colorPicker.getHexString())
    });
}


Writer.prototype.displayColorPicker = function (callback) {
    this.colorPickerDialog.querySelector('.ok').addEventListener('click', function () {
        writer.colorPickerDialog.close();        
        callback()

    });
    this.colorPickerDialog.showModal()
}
Writer.prototype.init = function () {
    document.execCommand('styleWithCSS', false, true);    
    var writer = this;
    this.statsDialog = this.elem.querySelector('#statsdialog');
    this.showDialogButton = this.elem.querySelector('#show-dialog');
    if (!this.statsDialog.showModal) {
        dialogPolyfill.registerDialog(this.statsDialog);
    }

    this.statsDialog.querySelector('.ok').addEventListener('click', function () {
        this.statsDialog.close();

    });

    this.colorPickerDialog = this.elem.querySelector('#color-picker-dialog');
    if (!this.colorPickerDialog.showModal) {
        dialogPolyfill.registerDialog(this.colorPickerDialog);
    }
    this.colorPicker = new ColorPicker();
    this.colorPicker.appendTo(this.elem.querySelector('#color-picker-div'))

    this.newKeywordDialog =  this.elem.querySelector('#new-keyword-dialog');
    if (!this.newKeywordDialog.showModal) {
        dialogPolyfill.registerDialog(this.newKeywordDialog);
    }

    this.oEditor = document.getElementById("editor");
    this.backArrow = document.getElementById("back-arrow");
    this.backArrow.addEventListener("click", function () {
        var { ipcRenderer, remote } = require('electron');
        var main = remote.require("./main.js");
        var win = remote.getCurrentWindow();
        main.displayMainWindow(win.getSize(), win.getPosition());
        win.close()
    });
    this.toolbarManager = new ToolbarManager()
    this.toolbarManager.addToolbar(document.getElementById("format-toolbar"))
    var toolbarManager = this.toolbarManager
    document.getElementById("format-button").addEventListener("click", function () {
        toolbarManager.toggleToolbar(document.getElementById("format-toolbar"))
    });
    // $("#editor").webkitimageresize().webkittableresize().webkittdresize();
}
Writer.prototype.displayCountDialog = function () {
    if (window.getSelection().toString().length == 0) {
        nouveauDiv = oDoc;
    }
    else {
        nouveauDiv = document.createElement("div");
        nouveauDiv.innerHTML = window.getSelection();
    }
    Countable.once(nouveauDiv, function (counter) {
        mStatsDialog.querySelector('.words_count').innerHTML = counter.words;
        mStatsDialog.querySelector('.characters_count').innerHTML = counter.characters;
        mStatsDialog.querySelector('.sentences_count').innerHTML = counter.sentences;
        mStatsDialog.showModal();
    });

}




Writer.prototype.increaseFontSize = function () {
    surroundSelection(document.createElement('big'));
}
Writer.prototype.decreaseFontSize = function () {
    surroundSelection(document.createElement('small'));
}
Writer.prototype.surroundSelection = function (element) {
    if (window.getSelection) {
        var sel = window.getSelection();
        if (sel.rangeCount) {
            var range = sel.getRangeAt(0).cloneRange();
            range.surroundContents(element);
            sel.removeAllRanges();
            sel.addRange(range);
        }
    }
}

Writer.prototype.addKeyword = function(word){
    this.note.metadata.keywords.push(word);
    this.seriesTaskExecutor.addTask(this.saveNoteTask.saveTxt)
    this.refreshKeywords();
}

Writer.prototype.setColor = function (color) {
    document.execCommand('styleWithCSS', false, true);
    document.execCommand('foreColor', false, color);
}

Writer.prototype.fillColor = function (color) {
    document.execCommand('backColor', false, color);
}

var ToolbarManager = function () {
    this.toolbars = [];
}
ToolbarManager.prototype.addToolbar = function (elem) {
    this.toolbars.push(elem)
    $(elem).hide()
}

ToolbarManager.prototype.toggleToolbar = function (elem) {
    for (let toolbar of this.toolbars) {
        if (toolbar != elem)
            $(toolbar).hide()
    }
    $(elem).show()

    resetScreenHeight()
}


var SeriesTaskExecutor = function () {
    this.task = []
    this.isExecuting = false
}

SeriesTaskExecutor.prototype.addTask = function (task) {
    this.task.push(task)
    console.log("push " + this.isExecuting)

    if (!this.isExecuting) {
        this.execNext()
    }

}

SeriesTaskExecutor.prototype.execNext = function () {
    this.isExecuting = true
    console.log("exec next ")
    if (this.task == undefined)
        this.task = []
    if (this.task.length == 0) {
        this.isExecuting = false;
        return;
    }
    var executor = this;
    this.task.shift()(function () {
        executor.execNext()
    })
    console.log("this.task length " + this.task.length)

}

var SaveNoteTask = function (writer) {
    this.writer = writer;

}

SaveNoteTask.prototype.saveTxt = function (onEnd) {
   
    var fs = require('fs');
    console.log("saving")
    fs.unlink(__dirname + "/reader.html", function () {
        fs.writeFile(__dirname + '/index.html', this.writer.oEditor.innerHTML, function (err) {
            if (err) {
                onEnd()
                return console.log(err);
            }
            this.writer.note.metadata.last_modification_date = Date.now();
            console.log("saving meta  "+ this.writer.note.metadata.keywords[0])
            fs.writeFile(__dirname + '/metadata.json', JSON.stringify(this.writer.note.metadata), function (err) {
                if (err) {
                    onEnd()
                    return console.log(err);
                }
                this.writer.oEditor.innerHTML
                console.log("compress")
                this.writer.noteOpener.compressFrom(__dirname, function () {
                    console.log("compressed")

                    onEnd()
                })
            });

        });


    })
}