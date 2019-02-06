FILE_A=`mktemp`
FILE_B=`mktemp`
json_reformat < ../../versions/target/$1 > $FILE_A
json_reformat < ../../versions/target/$2 > $FILE_B
diff -u $FILE_A $FILE_B
