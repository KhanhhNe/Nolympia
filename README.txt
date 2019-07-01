Requirements:
    Node.js: newest
    Python: 3 or above

    * Should be accessed using newest version of Chrome/Firefox/CocCoc/...


Commands:
    Install: npm install
    Run: npm start
    Debug: npm run debug

    Reset data: npm run set-data default
    Set data from file: npm run set-data <./path/to/file>


The server's IP will appear in command line when you run it.


Insert data:
    Make a text file consists of:
        Line 1: empty line
        Line 2: admin password
        Line 3-10:
            Line 3,5,7,9: Users' name
            Line 4,6,8,10: Users' password

        # Round 1
        Line 11-58:
            Each 12 lines: 12 questions for users (1,2,3,4)

        # Round 2
        Line 59-68:
            Each 2 lines: question and answer for question 1,2,3,4,5

        # Round 3
        Line 69-80:
            Each 3 lines: question, answer and video url for question 1,2,3,4

        # Round 4
        Line 81-116:
            Each 12 lines:
                Each 3 lines: questions for packet 40pts, 60pts, 80pts
    Then, drag & drop the file into "./taocauhoi/dt_insert.py". The result file will be in that folder with name "result.json". Use that file to set data for the server and you're good to go.


Users default passwords:
    admin: Admin
    user 1: User 1
    user 2: User 2
    user 3: User 3
    user 4: User 4


Round 2 notes:
    - Keyword for the whole round is not managed by the program, must be done manually
    - Change the key image by replacing image in ./static/img/v2bg.jpg

Insert video for round 3:
    Method 1: Insert video to ./static/<video_path> and the video path will be /static/<video_path>
    Method 2: Get video url from other sources and insert the link