cmd_Release/kinect.node := c++ -bundle -undefined dynamic_lookup -Wl,-search_paths_first -mmacosx-version-min=10.5 -arch x86_64 -L./Release -L/usr/local/lib  -o Release/kinect.node Release/obj.target/kinect/src/kinect.o -lfreenect