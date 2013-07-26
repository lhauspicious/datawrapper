<?php

//GET route
$app->get('/account/activate/:token', function ($token) use ($app) {
    disable_cache($app);

    $page = array();
    add_header_vars($page, 'about');
    if (!empty($token)) {
        $users = UserQuery::create()
          ->filterByActivateToken($token)
          ->find();

        if (count($users) != 1) {
            $page['alert'] = array(
                'type' => 'error',
                'message' => __('This activation token is invalid. Your email address is probably already activated.')
            );
        } else {
            $user = $users[0];
            $user->setRole('editor');
            $page['alert'] = array(
                'type' => 'success',
                'message' => sprintf(__('Your email address %s has been successfully activated!'), $user->getEmail())
            );
            $user->setActivateToken('');
            $user->save();
        }
    }
    $app->render('home.twig', $page);
});


/*
 * check invitation token and show invited page
 */
$app->get('/account/invite/:token', function($token) use ($app) {
    disable_cache($app);
    _checkInviteTokenAndExec($token, function($user) use ($app) {
        $page = array(
            'email' => $user->getEmail(),
            'auth_salt' => DW_AUTH_SALT
        );
        add_header_vars($page, 'about');
        $app->render('invited.twig', $page);
    });
});

/*
 * store new password, clear invitation token and login
 */
$app->post('/account/invite/:token', function($token) use ($app) {
    _checkInviteTokenAndExec($token, function($user) use ($app) {
        $data = json_decode($app->request()->getBody());
        $user->setPwd($data->pwd);
        $user->setActivateToken('');
        $user->save();
        DatawrapperSession::login($user);
        print json_encode(array('result' => 'ok'));
    });
});

function _checkInviteTokenAndExec($token, $func) {
    if (!empty($token)) {
        $user = UserQuery::create()->findOneByActivateToken($token);
        if ($user && $user->getRole() != 'pending') {
            $func($user);
        } else {
            // this is not a valid token!
            $page['alert'] = array(
                'type' => 'error',
                'message' => __('The invitation token is invalid.')
            );
            global $app;
            $app->redirect('/');
        }
    }
}