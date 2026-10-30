import importlib.util
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

spec = importlib.util.spec_from_file_location("install", Path(__file__).resolve().parents[1] / "scripts/install.py")
installer = importlib.util.module_from_spec(spec)
spec.loader.exec_module(installer)


class InstallationTest(unittest.TestCase):
    def test_install_update_and_preserve_default(self):
        with tempfile.TemporaryDirectory() as directory:
            home = Path(directory)
            (home / "layouts").mkdir()
            original = home / "layouts/main.json"
            original.write_text("original")
            installer.install(home)
            installer.install(home)  # Idempotent without modifying settings/keys.
            files = installer.sources()
            files["mods/tabs-graph/main.js"] += b"\n// updated\n"
            with patch.object(installer, "sources", return_value=files):
                installer.install(home)
            self.assertEqual((home / "mods/tabs-graph/main.js").read_bytes(), files["mods/tabs-graph/main.js"])
            self.assertEqual(original.read_text(), "original")
            self.assertFalse((home / "keys.json").exists())
            self.assertFalse((home / "settings.json").exists())

    def test_collision_stops_before_any_write(self):
        with tempfile.TemporaryDirectory() as directory:
            home = Path(directory)
            (home / "mods/git-graph").mkdir(parents=True)
            with self.assertRaisesRegex(ValueError, "Name already exists"):
                installer.install(home)
            self.assertFalse((home / "layouts").exists())

    def test_user_edit_stops_update(self):
        with tempfile.TemporaryDirectory() as directory:
            home = Path(directory)
            installer.install(home)
            target = home / "mods/tabs-graph/main.js"
            target.write_text("my local version")
            with self.assertRaisesRegex(ValueError, "Installed file changed"):
                installer.install(home)
            self.assertEqual(target.read_text(), "my local version")

    def test_symlink_and_invalid_manifest_are_rejected(self):
        with tempfile.TemporaryDirectory() as directory, tempfile.TemporaryDirectory() as outside:
            home = Path(directory)
            (home / "mods").symlink_to(outside, target_is_directory=True)
            with self.assertRaisesRegex(ValueError, "Symlink"):
                installer.install(home)
            self.assertFalse((home / "layouts").exists())
            (home / "mods").unlink()
            (home / installer.MANIFEST).write_text("{broken")
            with self.assertRaisesRegex(ValueError, "Cannot read installation manifest"):
                installer.install(home)


if __name__ == "__main__":
    unittest.main()
