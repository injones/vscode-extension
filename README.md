# tardis

- `tardis.status` - Show current git status in a quick input menu.
- `tardis.pin` - Pin the current resource file.
- `tardis.pins` - Open editable file of current file pins.
- `tardis.gotoPin1` - Goto to the first pinned file.
- `tardis.gotoPin2` - Goto to the second pinned file.
- `tardis.gotoPin3` - Goto to the third pinned file.
- `tardis.gotoPin4` - Goto to the fourth pinned file.

# Installation

1. Use `vsce` to package the extension.

```bash
vsce package
```

2. Install the generated `.vsix` file from the editor:
    1. Go to the Extensions view.
    2. Select Views and More Actions...
    3. Select Install from VSIX...

3. Install the generated `.vsix` file from the command line:
```bash
code --install-extension tardis-0.0.1.vsix
```