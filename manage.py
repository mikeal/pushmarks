import os
import mozrunner

parent_path = os.path.abspath(os.path.dirname(__file__))
extension_path = os.path.join(parent_path, 'extension')

class CLI(mozrunner.CLI):
    def get_profile(self, *args, **kwargs):
        profile = super(CLI, self).get_profile(*args, **kwargs)
        profile.install_plugin(extension_path)

        return profile



if __name__ == "__main__":
    CLI().run()