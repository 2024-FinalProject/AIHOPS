echo "Deleting dist"
sudo rm -r dist

echo "Building app..."
npm run build

echo "Deleting current version..."
sudo rm -r hagai@vm1:/var/www/aihops.cs.bgu.ac.il

echo "deploying files to server..."
scp -r dist/* hagai@vm1:/var/www/aihops.cs.bgu.ac.il/

echo "Done!"