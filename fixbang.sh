#\!/bin/sh
find /home/Maker/kaiju/app -name '*.kt' -exec sed -i 's/\\\!/\!/g' {} \;
echo "bang-fix applied"
